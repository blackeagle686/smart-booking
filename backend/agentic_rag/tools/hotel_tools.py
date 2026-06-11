import logging
import uuid
from datetime import datetime
from api.models import City, Hotel, Room, Booking
from agentic_rag.ingest.vector_store import VectorStoreManager

logger = logging.getLogger(__name__)

def search_semantic(query: str, item_type: str = None, limit: int = 5):
    """
    Search cities, hotels, or rooms using semantic search via ChromaDB vectors.
    item_type can be 'city', 'hotel', or 'room'.
    """
    try:
        results = VectorStoreManager.similarity_search(query, limit=limit, item_type=item_type)
        if not results:
            return {"message": "No results found. Please ask the user for more details or a different spelling."}
            
        for res in results:
            meta = res.get('metadata', {})
            if meta.get('type') == 'city' and meta.get('id'):
                try:
                    city = City.objects.get(id=meta['id'])
                    g_urls = [city.image.url] if city.image else []
                    for g in city.gallery.all():
                        if g.image: g_urls.append(g.image.url)
                    meta['gallery'] = g_urls
                    meta['lat'] = city.lat
                    meta['lon'] = city.lon
                    meta['image'] = city.image.url if city.image else ""
                    meta['link'] = f"/city/{city.id}"
                except Exception:
                    pass
            elif meta.get('type') == 'hotel' and meta.get('id'):
                try:
                    hotel = Hotel.objects.get(id=meta['id'])
                    meta['lat'] = hotel.lat
                    meta['lon'] = hotel.lon
                    meta['image'] = hotel.image.url if hotel.image else ""
                    meta['link'] = f"/hotels/{hotel.id}"
                except Exception:
                    pass
        return results
    except Exception as e:
        logger.error(f"Error in search_semantic: {e}")
        return {"error": str(e)}

def search_cities(name: str = None, limit: int = 5):
    """
    Search the database directly for cities by name.
    """
    try:
        cities = City.objects.prefetch_related('gallery').all()
        if name:
            cities = cities.filter(name__icontains=name)
        
        results = []
        for city in cities[:limit]:
            gallery_urls = [city.image.url] if city.image else []
            for g in city.gallery.all():
                if g.image: gallery_urls.append(g.image.url)

            results.append({
                "city_id": city.id,
                "name": city.name,
                "lat": city.lat,
                "lon": city.lon,
                "image": city.image.url if city.image else "",
                "gallery": gallery_urls,
                "link": f"/city/{city.id}",
                "description": city.description or "No description available."
            })
        
        if not results:
            return {"message": "No cities found matching that name. Ask the user to clarify."}
            
        return results
    except Exception as e:
        return {"error": str(e)}

def search_hotels(query: str = None, city_name: str = None, limit: int = 5):
    """
    Search the database directly for hotels. Can search by general text query and/or city name.
    """
    try:
        hotels = Hotel.objects.select_related('city').all()
        if city_name:
            hotels = hotels.filter(city__name__icontains=city_name)
        if query:
            hotels = hotels.filter(title__icontains=query) | hotels.filter(location__icontains=query)
            
        results = []
        for hotel in hotels[:limit]:
            results.append({
                "hotel_id": hotel.id,
                "title": hotel.title,
                "location": hotel.location,
                "lat": hotel.lat,
                "lon": hotel.lon,
                "image": hotel.image.url if hotel.image else "",
                "link": f"/hotels/{hotel.id}",
                "city": hotel.city.name if hotel.city else "Egypt",
                "city_id": hotel.city.id if hotel.city else None,
                "rate": hotel.rate,
                "reviews": hotel.reviews
            })
            
        if not results:
            return {"message": "No hotels found matching that criteria. Ask the user for more preferences or a different location."}
            
        return results
    except Exception as e:
        return {"error": str(e)}

def get_hotel_details(hotel_id: int):
    """
    Fetch comprehensive information about a hotel including all of its available rooms.
    """
    try:
        hotel = Hotel.objects.prefetch_related('rooms').get(id=hotel_id)
        rooms_list = []
        for r in hotel.rooms.all():
            rooms_list.append({
                "room_id": r.id,
                "room_title": r.title,
                "price_per_night": float(r.price_per_night),
                "description": r.description,
                "rate": r.rate,
                "available_from": str(r.available_from) if r.available_from else None,
                "available_to": str(r.available_to) if r.available_to else None,
            })
            
        return {
            "hotel_id": hotel.id,
            "title": hotel.title,
            "location": hotel.location,
            "lat": hotel.lat,
            "lon": hotel.lon,
            "image": hotel.image.url if hotel.image else "",
            "link": f"/hotels/{hotel.id}",
            "description": hotel.description,
            "rate": hotel.rate,
            "reviews": hotel.reviews,
            "city": hotel.city.name if hotel.city else "Egypt",
            "city_id": hotel.city.id if hotel.city else None,
            "rooms": rooms_list
        }
    except Hotel.DoesNotExist:
        return {"error": f"Hotel with ID {hotel_id} not found."}
    except Exception as e:
        return {"error": str(e)}

def get_cheapest_rooms(city_name: str = None, limit: int = 5):
    """
    Search for the best room deals (cheapest price) in Egypt or in a specific city.
    """
    try:
        rooms = Room.objects.select_related('hotel', 'hotel__city').all()
        if city_name:
            rooms = rooms.filter(hotel__city__name__icontains=city_name)
            
        rooms = rooms.order_by('price_per_night')[:limit]
        
        results = []
        for r in rooms:
            results.append({
                "room_id": r.id,
                "room_title": r.title,
                "hotel_title": r.hotel.title,
                "hotel_id": r.hotel.id,
                "city": r.hotel.city.name if r.hotel.city else "Egypt",
                "city_id": r.hotel.city.id if r.hotel.city else None,
                "price_per_night": float(r.price_per_night),
                "description": r.description,
                "available_from": str(r.available_from) if r.available_from else None,
                "available_to": str(r.available_to) if r.available_to else None,
            })
            
        if not results:
            return {"message": "No rooms found for that city/criteria. Inform the user and ask them if they have another preference."}
            
        return results
    except Exception as e:
        return {"error": str(e)}

def show_booking_form(room_id: int, check_in_date: str = "", check_out_date: str = ""):
    """
    Renders the UI form for the user to book a room. Returns a system instruction.
    """
    return {"message": f"Successfully loaded UI. Output exactly this string and nothing else: `[BOOKING_FORM: {room_id} | {check_in_date} | {check_out_date}]`"}

def prepare_booking(room_id: int, check_in_date: str, check_out_date: str):
    """
    Verifies room availability and prepares a 1-Click Zero-Booking widget for the user.
    Always use this when a user asks to book a room without explicitly asking for a form.
    """
    try:
        room = Room.objects.select_related('hotel').get(id=room_id)
    except Room.DoesNotExist:
        return {"error": f"Room with ID {room_id} not found."}
        
    try:
        check_in = datetime.strptime(check_in_date, "%Y-%m-%d").date()
        check_out = datetime.strptime(check_out_date, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}
        
    if check_in >= check_out:
        return {"error": "Check-in date must be strictly before check-out date."}
        
    if room.available_from and check_in < room.available_from:
        return {"error": f"Room is only available from {room.available_from}."}
    if room.available_to and check_out > room.available_to:
        return {"error": f"Room is only available until {room.available_to}."}
        
    overlapping = room.bookings.filter(check_in_date__lt=check_out, check_out_date__gt=check_in)
    if overlapping.exists():
        return {"error": "This room is already booked/reserved for some or all of the selected dates."}
        
    nights = (check_out - check_in).days
    total_price = nights * float(room.price_per_night)
    
    return {
        "status": "success",
        "message": f"Room is available and ready for 1-click booking! Tell the user the total price is EGP {total_price}. Then output exactly this string on its own line: `[BOOKING_WIDGET:{room_id}:{check_in_date}:{check_out_date}:{total_price}]`"
    }

def generate_itinerary(city_name: str, days: int, preferences: str = "general"):
    """
    Triggers the generation of an interactive itinerary timeline UI.
    """
    return {
        "message": f"You are acting as a luxury travel concierge. Output an itinerary for {city_name} for {days} days focusing on {preferences}. Format it exactly as a single tag: `[ITINERARY: {city_name} | Day 1: Activity 1; Activity 2 | Day 2: Activity 1; Activity 2]`. Do not use markdown around the tag, and ensure you use the exact pipe (|) and semicolon (;) delimiters."
    }

def book_room(user, room_id: int, check_in_date: str, check_out_date: str, screenshot_path: str = ""):
    """
    Create a room booking request for the currently authenticated user.
    """
    try:
        room = Room.objects.select_related('hotel').get(id=room_id)
    except Room.DoesNotExist:
        return {"error": f"Room with ID {room_id} not found."}
        
    try:
        check_in = datetime.strptime(check_in_date, "%Y-%m-%d").date()
        check_out = datetime.strptime(check_out_date, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}
        
    if check_in >= check_out:
        return {"error": "Check-in date must be strictly before check-out date."}
        
    # Check date boundaries
    if room.available_from and check_in < room.available_from:
        return {"error": f"Room is only available from {room.available_from}."}
    if room.available_to and check_out > room.available_to:
        return {"error": f"Room is only available until {room.available_to}."}
        
    # Check double booking/overlaps
    overlapping = room.bookings.filter(check_in_date__lt=check_out, check_out_date__gt=check_in)
    if overlapping.exists():
        return {"error": "This room is already booked/reserved for some or all of the selected dates."}
        
    # Calculate price
    nights = (check_out - check_in).days
    total_price = nights * float(room.price_per_night)
    
    # Create booking request
    booking = Booking.objects.create(
        user=user,
        room=room,
        check_in_date=check_in,
        check_out_date=check_out,
        total_price=total_price,
        payment_screenshot=screenshot_path,
        is_approved=False, # requires admin approval
        booking_code=uuid.uuid4()
    )
    
    return {
        "status": "success",
        "message": f"Successfully created booking request for {room.title} at {room.hotel.title}!",
        "booking_id": booking.id,
        "booking_code": str(booking.booking_code),
        "check_in": str(booking.check_in_date),
        "check_out": str(booking.check_out_date),
        "total_price": float(booking.total_price),
        "is_approved": booking.is_approved,
        "payment_instruction": "Please note your booking requires upload of a Vodafone Cash transfer screenshot on your profile page to be approved by admins."
    }

# ----------------- LLM TOOL SCHEMAS -----------------

TOOLS_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_semantic",
            "description": "Perform semantic search across all cities, hotels, and rooms in the database using vector embeddings. Useful for open-ended queries like 'hotels near the beach' or 'luxurious stays in upper egypt'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The natural language query to search for."
                    },
                    "item_type": {
                        "type": "string",
                        "enum": ["city", "hotel", "room"],
                        "description": "Filter results by specific item type (city, hotel, or room)."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of results to return (default 5)."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_cities",
            "description": "Search for cities registered in the database by their name (e.g. Cairo, Alexandria, Aswan).",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name or keyword of the city."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of results to return (default 5)."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_hotels",
            "description": "Search the database directly for hotels. Can search by keyword (title/location) and/or city name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Keyword to search in hotel title or location details."
                    },
                    "city_name": {
                        "type": "string",
                        "description": "Filter by city name."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of results to return (default 5)."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_hotel_details",
            "description": "Get detailed information about a specific hotel, including its reviews, description, location, rating, and a list of all available rooms with their rates and availability ranges.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hotel_id": {
                        "type": "integer",
                        "description": "The unique ID of the hotel."
                    }
                },
                "required": ["hotel_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_cheapest_rooms",
            "description": "Find the cheapest room rates (best deals) in Egypt. Can optionally filter by a specific city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city_name": {
                        "type": "string",
                        "description": "Filter deals by city name."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of results to return (default 5)."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "show_booking_form",
            "description": "Call this tool whenever a user explicitly asks to book a specific room. It instantly renders the UI form.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": {
                        "type": "integer",
                        "description": "The exact ID of the room the user wants to book."
                    },
                    "check_in_date": {
                        "type": "string",
                        "description": "Optional Check-in date if provided (YYYY-MM-DD)."
                    },
                    "check_out_date": {
                        "type": "string",
                        "description": "Optional Check-out date if provided (YYYY-MM-DD)."
                    }
                },
                "required": ["room_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_room",
            "description": "Create a room reservation/booking for the user. Always verify the room_id and clarify check-in and check-out dates with the user first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": {
                        "type": "integer",
                        "description": "The unique ID of the room to book."
                    },
                    "check_in_date": {
                        "type": "string",
                        "description": "Check-in date in YYYY-MM-DD format."
                    },
                    "check_out_date": {
                        "type": "string",
                        "description": "Check-out date in YYYY-MM-DD format."
                    },
                    "screenshot_path": {
                        "type": "string",
                        "description": "The file path of the uploaded Vodafone Cash screenshot if provided by the user system context."
                    }
                },
                "required": ["room_id", "check_in_date", "check_out_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "prepare_booking",
            "description": "Verifies availability and prepares a 1-Click Zero-Booking widget for the user. Use this before creating an actual booking.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": { "type": "integer", "description": "The unique ID of the room." },
                    "check_in_date": { "type": "string", "description": "Check-in date in YYYY-MM-DD format." },
                    "check_out_date": { "type": "string", "description": "Check-out date in YYYY-MM-DD format." }
                },
                "required": ["room_id", "check_in_date", "check_out_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_itinerary",
            "description": "Generates a highly visual, interactive day-by-day itinerary timeline for the user. Use this whenever the user asks to plan a trip, tour, or itinerary.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city_name": { "type": "string", "description": "The destination city." },
                    "days": { "type": "integer", "description": "Number of days for the trip." },
                    "preferences": { "type": "string", "description": "User preferences (e.g., romantic, family, historical, relaxing)." }
                },
                "required": ["city_name", "days"]
            }
        }
    }
]

# Map string name to executable python function
TOOLS_FUNCTIONS = {
    "search_semantic": search_semantic,
    "search_cities": search_cities,
    "search_hotels": search_hotels,
    "get_hotel_details": get_hotel_details,
    "get_cheapest_rooms": get_cheapest_rooms,
    "show_booking_form": show_booking_form,
    "prepare_booking": prepare_booking,
    "book_room": book_room,
    "generate_itinerary": generate_itinerary
}
