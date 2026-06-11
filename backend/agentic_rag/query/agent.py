import json
import logging
from agentic_rag.services.llm import LLMService
from agentic_rag.tools.hotel_tools import TOOLS_SCHEMAS, TOOLS_FUNCTIONS

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are OasisStays AI, an elite, highly professional, cinematic, and helpful booking concierge for hotels and resorts in Egypt.

Your capabilities:
1. Search Egyptian cities (e.g. Cairo, Luxor, Aswan, Hurghada, Sharm El Sheikh).
2. Search and provide detailed information on hotels, locations, ratings, reviews, and amenities.
3. Find the best rates and cheapest deals in Egypt or a specific city.
4. Create hotel room booking requests directly for users.

Formatting & Answering Style (CRITICAL):
- Always structure your responses beautifully using Markdown.
- Use bold headers (`### ` or `** **`) for different sections (e.g., **Hotel Details**, **Price Breakdown**).
- Use bullet points (`-`) to list amenities, rules, or features to make reading extremely easy and scannable.
- Incorporate appropriate, premium emojis (e.g. 🌴, 🏨, 🌊, 🛏️, ✨) to make the text lively and attractive.
- Your tone must be warm, enthusiastic, highly descriptive, and luxurious. Paint a picture for the user.
- Keep paragraphs short and concise.
- 🗺️ LOCATION MAPS: If your tool search results include 'lat' and 'lon' coordinates, YOU ABSOLUTELY MUST output this exact string somewhere in your text: `[MAP: <Name> | <lat> | <lon> | <image> | <link>]`. Example: `[MAP: Aswan | 24.08 | 32.89 | /media/city.jpg | /city/1]`. DO NOT skip this if coordinates exist!
- 🖼️ CINEMATIC CAROUSEL: If your tool search results include a 'gallery' array of images, YOU ABSOLUTELY MUST output this exact string: `[GALLERY: <Name> | <url1>,<url2>,...]`. Example: `[GALLERY: Aswan | /media/1.jpg,/media/2.jpg]`. DO NOT skip this if the gallery array exists!

Core Instructions:
- When searching, prefer using 'search_semantic' first, or direct DB query tools.
- CRITICAL: If a tool returns a message indicating "No results found", DO NOT repeatedly call the same tool. Immediately respond to the user, relay the message, and ask them to clarify (e.g., spelling, city, dates).
- CRITICAL: Whenever you mention a specific entity (Hotel, City, or Room) AND you know its exact integer ID from the tool results (e.g. `hotel_id`, `city_id`, `room_id`), YOU MUST wrap its name in a markdown link pointing to its details page. 
  * Hotel: `[Exact Hotel Name](/hotels/<integer_hotel_id>)`
  * City: `[Exact City Name](/city/<integer_city_id>)`
  * Room: `[Exact Room Title](/book/<integer_room_id>)`
- 🚨 DO NOT GUESS IDs! If the tool did not provide the exact ID for the entity, DO NOT make it a link. Just output its name as plain text.
- 🚨 BOOKING WORKFLOW (CRITICAL OVERRIDE): If the user asks to book a room, YOU MUST NOT call `book_room`. Instead, you MUST call the `show_booking_form` tool with the `room_id` and any dates they provided. When that tool returns the form tag, you MUST output ONLY that exact tag (e.g. `[BOOKING_FORM: 5 | 2026-06-15 | 2026-06-20]`). The system will then automatically render the booking UI for them.
- Only call `book_room` AFTER the user submits the form and you receive the `[SYSTEM INFO: ...]` message.
- When the user fills out the form, you will receive a new message containing `[SYSTEM INFO: ...]`. ONLY THEN should you call the `book_room` tool using the exact dates and `screenshot_path` provided in that system message.
- If a booking succeeds, you MUST show the user an elegant booking details card and embed their unique QR code using exactly this markdown format: `![Booking QR Code](https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=<booking_code>)` where `<booking_code>` is the UUID returned by the tool.
"""

class AgenticRagAgent:
    @classmethod
    def run(cls, user, user_message: str, chat_history: list = None):
        """
        Runs the agentic loop.
        - user: Django User object (passed to booking tool).
        - user_message: The new message from the user.
        - chat_history: List of dicts representing past messages, e.g. [{"role": "user", "content": "..."}, ...]
        """
        if chat_history is None:
            chat_history = []

        # Prepare messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add history
        for msg in chat_history:
            messages.append({
                "role": msg.get("role"),
                "content": msg.get("content"),
                "tool_calls": msg.get("tool_calls", None),
                "name": msg.get("name", None),
                "tool_call_id": msg.get("tool_call_id", None)
            })
            
        # Add new user message
        messages.append({"role": "user", "content": user_message})

        logger.info(f"Agent running for user: {user.username} | Message: {user_message}")

        # Loop to handle tool calls (up to 5 iterations to prevent infinite loops)
        for iteration in range(5):
            response_message = LLMService.chat_completion(messages, tools=TOOLS_SCHEMAS)
            
            # Add assistant response to messages
            # Convert response message to dict for list
            msg_dict = {
                "role": "assistant",
                "content": response_message.content
            }
            if response_message.tool_calls:
                # Need to map tool calls to list of dicts for API compatibility on subsequent calls
                msg_dict["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    } for tc in response_message.tool_calls
                ]
            
            messages.append(msg_dict)

            # If no tool calls, we are done!
            if not response_message.tool_calls:
                return response_message.content

            # Execute tool calls
            for tool_call in response_message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)
                
                logger.info(f"LLM requested tool call: {func_name} with arguments: {func_args}")
                
                if func_name not in TOOLS_FUNCTIONS:
                    tool_result = {"error": f"Tool '{func_name}' is not registered."}
                else:
                    func_to_call = TOOLS_FUNCTIONS[func_name]
                    try:
                        # If booking, inject the Django user
                        if func_name == "book_room":
                            tool_result = func_to_call(user=user, **func_args)
                        else:
                            tool_result = func_to_call(**func_args)
                    except Exception as e:
                        logger.error(f"Error executing tool {func_name}: {e}")
                        tool_result = {"error": str(e)}

                logger.info(f"Tool {func_name} returned: {tool_result}")

                # Append tool response message
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": func_name,
                    "content": json.dumps(tool_result)
                })

        # Fallback if iterations exceed 5
        return "I apologize, but I encountered an issue resolving all operations. Please try again or refine your query."
