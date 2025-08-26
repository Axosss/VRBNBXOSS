# Dashboard for a rental owner using : airbnb, vrbo platform and direct booking.
This app serves people who owns apartment(s) that they rent on short or middle term.
It helps them follow which apartment are rented, when, for how much and if a cleaning has been booked in between two bookings.
It also helps us see how much money was made, with a set of interesting stats.
It also helps show the apartement with its availabilities to agency. 
It helps renters with a page made just for them : showing infos, plan, wifi code, digicode... 

It has multiple sections : 
- calendar,
- reservations,
- stats,
- cleaning,
- contracts,
- appartement(s),
- settings

V2.0 : We will only focus later on the last too pages :
- showcase : show the apartment online to future guest and companies. Can make a direct booking request with the agenda.
- renters (we will need to come up with a better name):  share informations to people actually renting the apartment (wifi, digicode etc)

## Calendar : 
It shows the reservations per appartment like on the airbnb calendar 
Shows each reservation. 
When a reservation is hovered or clicked (mobile version) on the calendar, it shows more infos (based on reservation infos)
The agenda can be scrolled to previous or later month. 
Can show 1 or multiple appartment calendar. based on color for each. This choice is made by clicking on nice big round rectangle apartment bouton at the top of the page. With the appartment logo / profile pic.
Airbnb calendar is a great inspiration

## Reservations : 
Each reservation is in a card. 
Reservation can be deleted, modified, updated or added. 

### V2.0 : In a later version they will be fetched through Airbnb, Vrbo or any other website iCal. 
- This will require an update system (if the reservation has been canceled, or updated (date,hours,guests...))
- each ical has its own sets of infos. Airbnb is differents than Vrbo 
    -  we will need to see which has what, converts dates, hours, et populate with our existing infos. 
    Example : We have already added all the infos for a reservations (infos not included in the ical), then it is modified in Airbnb, we have to update it without removing the manually added infos.
- if a reservation is updated : how to spot which one (guest name? + dates?, reservation number?) : we will need to see the icals and check. (each platform will require its own system)
- alert system and a resolve center if we have overlapping bookings for the same apartment.
At the top of this page we have a container with important infos such as : 
- New guest coming in ... days / or today / or leaving. 
- Cleaning infos for the next ones : Next cleaning the 6th of august for *appartment01* 

//- an update container, at the top of the page, that tells us : x new bookings since y. z was modified etc. 
//And more important : next reservation (for each appartment) (if exist) and next cleaning(s). 

### Reservation card contains : 
My naming is probably not correct, so take it as inspiration. And follow a strict a thorough system to name each.
- appartment_id
- reservation platform (airbnb, vrbo, direct), 
- guest name, 
- number of guest, 
- price, 
- date of entry and out with time (usually auto entered based on check in and check out hours but can be changed), 
- guest phone, 
- guest email,
- if a cleaning has been organized yet or not 
    - checkbox with a cleaner name, hour and date, 
- special infos : text box whre i can manually write more infos
if direct booking:
- guest adress, 
- guest id type,
- guest id number,

## Stats : basic stats for each appartment.
Are shown: individually, based on year, month or specific dates
And we have a total category, for all appartment stats at the end (optional)
### Stats: 
#### (based on the timeline choosed)
- € per month (with a graph), 
- average reservation price, 
- % of occupation, 
- total number of guest , 
- etc 
#### not based on timeline but on the year :
- best month, 
- most expensive reservation,
- hotest month (the month with the biggest amount of money), 
- etc  

## Cleaning : 

### Section with its own agenda, that shows : 
- the cleaning reservation, with all the cleaner, per apartment and for all the aprtment. 
- Can be exported per cleaner to send them the recap.

### Product sections where we have the number of product left: 
- sheets, pillow, cleaning products etc etc 
We can modify, add or delete (with a confirmation window)

## Contract : this will be done in the V2.0

Can be used to make contract based on specific infos such as : 
### Mobility lease contract:
Generate a contract based on documents + Appartment infos :
- adress, 
- floor
- elevator(s) 
- square meters, 
- language (en or fr), 
- guest_name,
- guest_adress,
- guest_arrival_date,
- guest_id_type,
- guest_id_number,
- reservation_price,
- reservation_check_in_time,
- reservation_check_out_time,
- payment_type(cash,wire,paypal),
- number_of_guests,

### Check-in report
- to be determined but has to do with product section + appartment furnitures 
### Check-out report
- based on the check in report, but with the check out conditions

## Appartement(s)
Where we add our appartments. 
Has : 
- name,
- pictures (size control),
- floor plans,
- size (sqr meters and en conversion type)
- Floor (which floor)
- Number of people allowed
- Has elevator?
- Has A/C?
- Number of rooms
- Number of bathrooms
- Number of  beds ans size or type (King, queen, simple, sofabed)
- TV
- Wifi (with the code so that we can link throughout the app)
- Fridge 
- etc

## Settings 
TBD

## Database : 
Look for the files included to get inspirations they are not complete, but they are a great starting base.

## Extra in a v2.0 
The website needs to have an :
- owner section with auth 
- a renter section,
- a showcase section

The owner section is access to all the features.
The showcase section is a single page for each appartment so that i can share a link to people to look the appartment.
The renter section is a section dedicated to sharing important infos such as : wifi, amenities, digicode, etc etc. Has to be created after so that we can complete it correctly. 


Special cleaning page for each cleaner : With the cleaning specificities. TBD
email auto / whatsapp auto for x days prior the checkin => Check in infos sent to the client. same for check out
whatsapp bot : can asnwer different questions based on Q&A

Extra : for cleaning
Appartement has their own cleaning instructions : can be shared to cleaners via its own page. This page would include their schedule, cleaning infos and appartment infos.

