var kObjects =
{
	backgarden:
	{
		desc: "It's a glorious sunny day and the {flowers} and {lawn} seem happy to be alive. And overgrown. Mostly overgrown.",
		name: "back garden",
		things:
		{
			kitchen: "A {kitchenhole} in the back wall of the house leads back into the {kitchen}.",
			shed: "[STATE:shed=seen]In the corner of the garden is a large wooden {shed}."
		},
		travel:
		{
			kitchen: "[STATE:garden=lawn]It takes a few seconds for your eyes to adjust to the bright sunny day that awaits you in the {backgarden}. Once they do, you take some time to enjoy the sight of the huge {flowers} and overgrown {lawn}. Lovely!",
			shedroof: "[STATE:garden=lawn]You drop down from the roof of the {shed} and attempt to roll safely onto the overgrown {lawn}. It doesn't go as elegantly as you'd hoped. Winded, you clutch your ribs and slowly stand up in the middle of the {backgarden}."
		}
	},
	banister:
	{
		combine:
		{
			lofthatch: "You reach up with the {banister} and prod the {lofthatch} but it won't open no matter how hard you jab.",
			bedroomdoor: "You knock on the {bedroomdoor} with the {banister} but there's no answer.",
			bedroomdoorhandle: "[STATE:stairs=done][STATE:bedroom=open][DELETE:banister.combine.bedroomdoor][DELETE:key.combine.bedroomdoor][DELETE:landing.things.landingrubble][SET:landing.things.bedroom=intobedroom][SET:bedroomdoorhandle.desc=handledented][DELETE:bedroomdoor.things.bedroomdoorhandle][DELETE:banister.combine.bedroomdoorhandle][SET:bedroomdoorhandle.collect=handlecollect][SET:landing.things.bedroomdoorhandle=landinghandle]You take a swing at the round metal door handle with the hefty {banister} and knock it clean off the {bedroomdoor}. It thuds into a wall and lands near your feet."
		},
		desc: "[STATE:stairs=bat]It's wooden, chunky, solid and slightly wider at one end than the other. You could give something a decent wallop with this."
    },
	battery:
	{ desc: "The battery has seemingly become fused with the {clockinsides} of the {clock}. There's no way that's coming free. Not without a powerful battery unfuser, and you left yours in your other jacket." },
	bedroom:
	{
		first: "You can tell you're in a {bedroom} by the presence of a bed, but were that not present you'd have been forgiven for thinking you were in a library: hundreds of books about chemistry, mathematics, space-time theory, quantum physics and practical engineering line the shelves and clutter the floor. They're also piled up on a desk next to a curious {pmm}. You struggle to read any book titles, though: there are thick {blackoutcurtains} in front of the window. You can barely see the {letter} on the bed.",
		desc: "You stand in the centre of the room, surrounded by books about science and engineering.",
		travel:
		{
			landing: "[STATE:bedroom=in]You push the {bedroomjustdoor} open and tip-toe into the dark {bedroom}. You don't really know why you're being so stealthy. You know there's nobody in it."
		},
		things:
		{
			blackoutcurtains: "Thick {blackoutcurtains} hang in front of a small window, waving slightly in the breeze.",
			pmm: "A clearly home-made {pmm} built out of metal cogs, multiple plastic wheels and a few pulleys sits - unmoving - on a desk with an open {drawer}.",
			landing: "[STATE:letter=seen]A hand-written {letter} is on the bed and a {bedroomjustdoor} leads back to the {landing}."
		}
	},
	pmm:
	{
		name: "machine",
		desc: "[STATE:bedroom=machine][SET:pmm.desc=pmmdesc][SET:pmm.name=pmm]You recognise the machine immediately as a {pmm}. A very fine example, if you do say so yourself. Slightly rickety, sure, and not working right now, but well designed and constructed.",
		things:
		{
		}
	},
	exclusionfield:
	{
		name: "exclusion field",
		desc: "The exclusion field is so close you could reach out and touch it - but you know not to. Anything which comes into contact with a pre-existing exclusion field has a tendency to go a little... dissolvey.",
		nothing: "[DELETE:exclusionfield.nothing]Beyond the exclusion field the entire world is (a) paused and (b) blissfully unaware that it's paused. A wren hangs in the air mid-flap. Static hovercars speed past at zero miles per hour, static hydrogen vapour puthering statically from their engine vents. Over the road a sprinkler system sits beneath thousands of motionless airborne water droplets. It's the ultimate still life."
	},
	blackoutcurtains:
	{
		name: "blackout curtains",
		first: "You pull aside the {blackoutcurtains} and peer outside at the street in front of the house. The constantly rippling and warping surface of the {exclusionfield} which surrounds the property is roughly an arm's length beyond the open window. It makes surveying the scene tricky but a few hundred metres away you think you can make out a couple running after a figure in a long white coat. All freeze-framed, of course.",
		desc: "You stand at open window for a while, hoping for the ripples of the {exclusionfield} to give you a better view of the 3 figures on the pavement. But the ripples do not acquiesce.",
	},
	bedroomdoor:
	{
		first: "The {bedroomdoor} is decorated with a safari scene: a landscape of matt emulsion gives a home to several large animals that look kinda like small stickers or vice versa, depending on point of view. They're faded and tatty with age. Over the scene are stuck several {bedroomdoorsigns} and balancing on the trunk of a cartoony elephant is the {bedroomdoorhandle}.",
		desc: "The door's safari scene is partially obscured by {bedroomdoorsigns}.",
		name: "bedroom door",
		nothing: "Springs and chunks of metal lie around it on the floor. It wasn't stuck - it was locked. Still, now that the handle is missing the door actually serves its purpose - connecting the {landing} and the {bedroom}.",
		things:
		{
			bedroomdoorhandle: "The {bedroomdoorhandle} is round and solid."
		}
	},
	bedroomdoorsigns:
	{
		name: "faux laboratory warning signs",
		desc: "The signs on the {bedroomdoor} warn about dangerous radiation, explosives, fast moving machinery and toxic chemicals. The largest sign of all says &quot;GAX'S ROOM&quot; and has a hazardous substance symbol in each corner."
	},
	bedroomdoorhandle:
	{
		name: "door handle",
		desc: "[STATE:bedroom=stuck]The {bedroomdoor}'s metal handle is round and cold to the touch. The size - you think - is approximately that of a baseball, albeit one which is stuck to a door. And stuck is the right word - it won't turn and the door won't open.",
		combine:
		{
			exclusionfield: "[LOSE:bedroomdoorhandle]You've heard that a skilful throw with a bit of backspin can bounce an object off the inside of an {exclusionfield}, charging it with a huge amount of static electricity so you give it a go. You lob the dented door handle at the exclusion field and watch it fizzle out of existence. You hope you didn't need it for anything."
		}
	},
	brokencommunicator:
	{
	    name: "long-range communicator",
		desc: "[STATE:garden=commbroken]It's a small shiny hand-held communication device, but it appears to be broken. The display tells you to contact the manufacturer to obtain a replacement - but if it's suffering from the same problem as last time then you'll be able to patch it up with a new decoder crystal.",
		collect: "[STATE:garden=comm]You grab the {shinything} out of the overgrown {lawn}. It's your {brokencommunicator}. You don't remember losing it.",
	},
	bedroomjustdoor:
	{
		name: "door",
		alias: "bedroomdoor"
	},
	chemicals:
	{
		desc: "There are plenty of exciting chemicals here. Some swirly and green. Some thick and gloopy. One of them is somehow stripy. One of the containers has a sticker on it which says &quot;Keep out of direct sunlight&quot;."
	},
	clock:
	{
		descFunc: RoomGame_DescribeClock
	},
	clockback:
	{
		desc: "[STATE:clock=screws]A plastic panel is attached to the back of the {clock} with two small metal screws.",
		name: "back"
	},
	clockinsides:
	{
		name: "insides",
		locationText: "{lounge} holding a partially dismantled {clock}",
		desc: "You peer at the inner workings of the {clock}.",
		nothing: "Inside is a messy looking {battery}.",
		things:
		{
			quartzcrystal: "Inside is a messy looking {battery} and a {quartzcrystal}, used to make sure the mechanism runs at the correct speed - although today it clearly isn't working as designed.",
		}
    },
	comminbox:
	{
		name: "green button",
		descFunc: RoomGame_CommInbox
    },
	commsend:
	{
		name: "ultra-violet button",
		descFunc: RoomGame_CommSend
	},
	commtracker:
	{
		name: "infra-red button",
		descFunc: RoomGame_CommTracker
	},
	communicator:
	{
		name: "long-range communicator",
		clicked: true,
		descFunc: RoomGame_DescribeCommDevice,
		usableCheck: RoomGame_CommIsUsable
	},
	crashedpodlong:
	{
		name: "crashed single-occupant drop-pod",
		alias: "crashedpod"
	},
	crashedpod:
	{
		name: "crashed drop-pod",
		desc: "[NOTHINGS][YOUAREHERE][SET:crashedpod.desc=crashedpod]Sitting in the pilot's chair isn't really an option as the entire vessel is somewhat inverted, so you stand in the middle of the roof and look about.",
		nothing: "You only have vague memories of landing it like this before crawling out, stumbling through the garden, blowing up the back wall of the house and making your way to the sofa to recover.",
		travel:
		{
			shedroof: "[STATE:loft=inpod]You climb from the {shedroof} onto the top of the vehicle. It's upside down so you struggle to contort your body in such a way that your eye is correctly aligned with the retina scanner but once you do you the windscreen opens and you crawl inside the {crashedpod}."
		},
		things:
		{
			engine: "The pod's {engine} is happily whirring away to itself despite its orientation.",
			podmanual: "At your feet is the regulation {podmanual}.",
			controls: "Most of the controls are unresponsive as the pod's not in flight but a few {buttons} remain illuminated.",
			shedroof: "The windscreen's still open and still leads back to the {shedroof}."
		}
	},
	buttons:
	{
		desc: "The illuminated buttons show the numbers {num0}, {num1}, {num2}, {num3}, {num4}, {num5}, {num6}, {num7}, {num8} and {num9}.",
		nothing: "Sadly, you've not needed to open the engine compartment for decades so you don't recall what you set as your memorable number when you set it up many, many moons ago."
	},
	num0:
	{
		name: "0",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num1:
	{
		name: "1",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num2:
	{
		name: "2",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num3:
	{
		name: "3",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num4:
	{
		name: "4",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num5:
	{
		name: "5",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num6:
	{
		name: "6",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num7:
	{
		name: "7",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num8:
	{
		name: "8",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	num9:
	{
		name: "9",
		clicked: true,
		descFunc: RoomGame_PodButton
	},
	drawer:
	{
		desc: "The drawer contains screws, bolts, an assortment of cables, a torque wrench set, a soldering iron and a whole mess of other bits and bobs.",
		nothing: "You have another rummage, but there's nothing you particularly want or need.",
		things:
		{
			diary: "[STATE:diary=out][DELETE:drawer.things.diary][SET:bedroom.things.diary=diaryinroom]Partially covered is a {diary} which you move onto the desk."
		}
	},
	diary:
	{
		desc: "[STATE:diary=read]It's a catalogue of all the inventions created in this room: their purposes, any issues faced during their development, their successes and failures. Each entry is numbered. The {pmm} on the desk is the most recent - invention number " + s_correctCode + "."
	},
	engine:
	{
		desc: "You pat the engine. Still going strong, despite the crash. You're particularly proud of the design: one of the models you invented, way back in the day.",
		nothing: "It's encased in a double-layer of steel so you can't see the cogs, wheels and pulleys but you can picture exactly what's going on in there.",
		things:
		{
		}
	},
	engineopening:
	{
		name: "opening",
		desc: "Through the opening you can see the engine's cogs, wheels and pulleys keeping themselves running. At the heart of the mechanism is a cylinder made of toughened and darkened glass; it contains a flywheel.",
		nothing: "The flywheel is spinning at breakneck speed. A sticker on the side of the cylinder reads &quot;CHARGE HERE&quot;.",
		things:
		{
		}
	},
	experiments:
	{
		name: "old science experiments",
		desc: "Dust has gathered for years on these old experiments: some nearly finished, others barely started. The products of an inquisitive but easily distracted young mind. Attempts at inventing communication machines, matter converters, hologram projectors, systems for controlling the weather and inverting gravity and pausing time. But rust and decay and entropy have made sure they certainly won't function now, if they ever did."
	},
	familyphotos:
	{
		name: "family photos",
		desc: "[STATE:sofa=sleep]A haphazard gallery if ever there was one. Photographs of a young inventor showing off one crazy experiment after another. Family portraits. Candid shots of the same young inventor around the house and garden either doodling on graph paper, testing crazy theories or tuckered out, asleep on the sofa in the lounge, contents spilling from pockets."
	},
	flowers:
	{
		desc: "The flowers are gorgeous and colourful and bring a smile to your face. They've clearly been growing somewhat enthusiastically since your arrival."
	},
	frontdoorlocked:
	{name: "front door", desc: "This charming {frontdoorlocked} boasts such wonderful modern features as a {keyhole} and a {letterbox}. Sorry, did I say charming? I meant the opposite of that. Or at least, I guess it depends on how much you love dents and scratches. Love them, and you'll love this door."},
	hallway:
	{ desc: "The hallway's cleanliness and decor both fall slightly short of what would pass in most people's eyes for habitable.", things: { frontdoorlocked: "A locked {frontdoorlocked} blocks any direct exit from the premises.", loungedoor: "A {loungedoor} leads into the {lounge}; you consider walking through it to get away from the awful {hallwaycarpet} beneath your feet. The hallway also provides access to the {kitchen} and the {stairs}." }, travel: { lounge: "You clutch the {loungedoorframe} as you stumble into the {hallway}. Something's spinning, but it's tricky to tell whether it's you or the {hallwayfloor} or the everything. #[LOOKATROOM]", stairs: "You head back down the {stairs} towards the {hallway}. Looking at the {hallwaycarpet} while descending makes your head swim." } },
	hallwaycarpet:
	{      name: "carpet",      alias: "hallwayfloor"     },
	hallwayfloor:
	{
		name: "floor",
		first: "The {hallwaycarpet} is a garish pattern featuring all the colours that never made it into the rainbow. It's a repeating noisy hallucination of various browns, rusts, khakis, burnt umbers, greys and several hues too awful to credit with names; a cross between a fleur-de-lis and a fractal trapped for all eternity inside a hall of mirrors, bruised and bloody from repeated attempts to escape through its own infinitely-repeating reflections. And it's tatty.",
		desc: "The carpet is still awful.",
		things:
		{
			flywheelbox: "But what's this? Barely visible thanks to the visual noise is a {flywheelbox}. You're lucky you didn't kick it and hurt your foot - along with everything else."
		}
    },
	handrail:
	{      name: "polished wooden hand-rail",      descFunc: RoomGame_UseHandRail     },
	head:
	{      desc: "There's a {headbump} on your head. Touching it generates a sharp stab of pain. After prodding it six or so times you decide to stop. OK, once more. Right, that'll do for now."     },
	headbump:
	{      name: "bump",      desc: "You can't see the bump on your {head} from where you're standing. You try moving a metre to the left, but that doesn't help. You move back again. Gah, this is useless! Stupid bump."     },
	key:
	{
		collect: "[STATE:sofa=key]It's a small metal {key}. There's no telling how long it's been lost in the {sofa}. You decide to take it with you.",
		desc: "It's a door key, or possibly a window key. Or maybe a key to a treasure chest. Or perhaps to something else. It has no label to clarify its purpose, I'm afraid.",
		combine:
		{
			bedroomdoor: "There's no keyhole in the {bedroomdoor}.",
			keyhole: "The small metal {key} doesn't fit into the {frontdoorlocked}'s {keyhole}. You make a mental note to keep an eye out for another lock or another key or both.",
			lofthatch: "[DELETE:banister.combine.lofthatch][STATE:loft=open][STATE:sofa=done][LOSE:key][DELETE:landing.things.lofthatch][SET:landing.desc=landingloftopen]You try unlocking the hatch with the key you found in the folds of the sofa. Success! It swings open, simultaneously revealing the {loft} and smacking you in the side of the {head} although curiously the accompanying flash of light doesn't subside with the pain."
		}
	},
	keyhole:
	{ desc: "You peer through the keyhole to get a glimpse of the outside world. Through flickering blue ripples you can see a street and the front of the house opposite but no matter how long you stare no vehicles or people pass by.", },
	kitchen:
	{
		travel:
		{
			backgarden: "[LOOKATROOM]Regretfully you leave the {backgarden} and head back into the house. A few seconds pass and your eyes have adjusted enough for you to see the contents of the {kitchen}. Which is a shame, as it ain't pretty.",
			hallway: "[LOOKATROOM]You leave the {hallway} and head for the {kitchen}, hoping for somewhere a little more pleasant on the senses. You are sorely disappointed."
		},
		desc: "The kitchen has seen better days, none of them recently.",
		nothing: "[STATE:toaster=look]It does, however, provide easy access to facilities such as the {hallway}, {backgarden} and {toaster}. So that's nice."
	},
	kitchenhole:
	{name: "large gaping hole", desc: "The twisted remains of the patio door aren't doing a terribly good job at restricting access between the {kitchen} and the {backgarden}. Looks like something exploded here."},
	kitchenknife:
	{
		name: "kitchen knife",
		combine:
		{
			clockback: "[STATE:clock=open][STATE:toaster=done][LOCATION:clockinsides]You unscrew the screws with the knife to gain access to the {clockinsides} of the {clock} - a time machine of sorts, you think to yourself, smirking."
		},
		desc: "[STATE:toaster=screwdriver]The cheap metal kitchen knife is blunt and dull. The end looks misshapen. Perhaps someone mistook it for a screwdriver.",
		collect: "[STATE:toaster=knife]You pull the cheap metal {knife} free from the {toaster}, glad that the power's not on."
	},
	knife:
	{      alias: "kitchenknife"     },
	landing:
	{
		desc: "Your eyes have nearly adjusted to how dark it is here, but they're not quite capable of doing so fully.",
		prefix: "You are on the",
		things:
		{	
			landingrubble: "[STATE:bedroom=seen]The only first floor room not made inaccessible by heavy {landingrubble} is instead blocked by a {bedroomdoor}.",
			lofthatch: "Above you is a closed {lofthatch}.",
			stairs: "[STATE:stairs=seen]Creaky {stairs} lead back to the ground floor of the property with a {handrail} running along the side."
		},
		travel:
		{
			stairs: "You reach the {landing} and automatically reach out and click on the light switch but without power you have to admit that it doesn't help all that much. #[LOOKATROOM]"
		}
	},
	landingrubble:
	{
		desc: "Without your robotic exoskeleton you won't be moving that rubble anywhere.",
		name: "rubble"
	},
	lawn:
	{
		desc: "The blades of grass reach almost to your knees. It'd be easy to lose something in this jungle.",
		nothing: "And you did, but then you found it.",
		things:
		{
			brokencommunicator: "[STATE:garden=glint]Oh, would you look at that! There's a {shinything} almost obscured by the greenery, glinting in the sun."
		}
	},
	letter:
	{
		desc: "[STATE:letter=read]The letter reads: # <I>&quot;I'm sorry. I'm sorry I blamed you for ruining my machine. I know you didn't do it on purpose. But I put the thick curtains up for a reason and this one was going to work and you wrecked everything and I'm sorry I threw the broken bit down the stairs at you and yelled at you but inventing is important to me and I don't think you understand that. So by the time you break into my room and read this I'll be long gone. Bye. Gax.&quot;</I>"
	},
	letterbox:
	{ desc: "The letter box is empty. No post today. Sorry.", name: "letter box" },
	loft:
	{
		desc: "Half of the loft is filled with cardboard boxes full of summer clothes, bags of old paperwork, broken electrical equipment and Christmas decorations. The other half of the loft is missing.",
		travel:
		{
			landing: "[STATE:loft=roof]Hauling yourself up into the {loft} you see why there's so much light pouring down onto the {landing}: a huge chunk of the building's roof (and indeed the building) has been demolished, knocked who-knows-where or otherwise removed from atop the property. You hope it doesn't rain.",
		},
		things:
		{
			shedroof: "Through the massive hole you can see down to the {shedrooflong}. You're sure you could drop onto it safely.",
			landing: "An open hatch leads back to the {landing}."
		}
	},
	lofthatch:
	{      name: "loft hatch",      desc: "[STATE:loft=locked]The loft hatch is locked tight. Hammering on it only succeeds in shaking down clouds of dust which you accidentally inhale."    },
	flywheelbox:
	{
		name: "perspex box with a flywheel in it",
		collect: "[STATE:letter=gotbox]You grab the {flywheelbox} and look at it for a while. It's handmade and rough around the edges, but it's seemingly intact. Which is good, as it's full of a translucent oily fluid which you really don't want on your hands.",
		descFunc: RoomGame_DescribeFlyWheelBox,
		combine:
		{
			pmm: "[STATE:bedroom=box][LOSE:flywheelbox][SET:pmm.things.flywheelbox=boxinmachine][DELETE:flywheelbox.collect]You push the {flywheelbox} into the gap in the {pmm}. It attaches with a small click.",
			chemicals: "[STATE:letter=oilchange][STATE:shed=done][SET:flywheelbox.combine.chemicals=flywheelchem]You pop the top off the perspex box and pour the liquid contents into an empty jar. You then refill the box with an identically-coloured but non-bubbling oily liquid from the range of chemicals. Finally, you replace the lid and push it until it's airtight.",
			engineopening: "[SET:engineopening.things.flywheelbox=charging][LOSE:flywheelbox][DELETE:flywheelbox.collect]You insert the perspex box into the {engineopening} and watch while the engine's recycled energy spins its flywheel faster and faster."
		},
	},
	pmmswitch:
	{
		name: "switch",
		desc: "[COLLECT:flywheelbox][DELETE:pmm.things.flywheelbox]You prod the switch and the {flywheelbox} pops out of the {pmm}. Without a second thought you reach down and grab it before it hits the floor."
	},
	podmanual:
	{
		name: "drop-pod user manual",
		desc: "Governmental transportation statutes dictate that no vehicle shall travel without a paper copy of its user manual. This one has your name - Professor P. Quantify - scrawled on the front cover. You must have read it cover to cover several times over the years and you know full well it won't help you out of this mess. Your drop-pod can't be fixed, not this time."
	},
	lounge:
	{
		desc: "The lounge, to put it bluntly, is a bit of a {mess}. An old {sofa} sits in the corner and an interior {loungedoor} leads to the {hallway}.",
		things:
		{
			clock: "[STATE:clock=odd]A plastic analogue {clock} hangs on the wall."
		},
		travel:
		{
			clockinsides: "[KEEPTRAVEL]You screw the plastic panel back onto the {clock} with the {kitchenknife} and return it to its spot on the wall of the {lounge}.",
			hallway: "You push open the creaky {loungedoor} - oof, what a noise - and make your way back into the {lounge}.[LOOKATROOM]"
		}
	},
	loungedoor:
	{ desc: "The door between the {lounge} and the {hallway} creaks whenever it moves. It's awfully loud. You clutch your {head} and immediately regret it.", name: "door" },
	loungedoorframe:
	{      alias: "loungedoor",      name: "doorframe"     },
	mess:
	{
		desc: "You didn't notice all this mess when you dragged yourself into the room to recover, but you're pretty sure it was caused by your arrival."
	},
	muscles:
	{
		desc: "You hope that getting up and walking about will stop your arms and legs from aching so much. You've spent enough time on the {sofa}."
	},
	openhatch:
	{
		name: "loft hatch",
		alias: "loft"
	},
	quartzcrystal:
	{
		collect: "[STATE:clock=crystal]You extract the {quartzcrystal} from the {clockinsides} of the {clock} using the {knife}. It pops out onto the palm of your hand, which tingles slightly.",
		desc: "The tingling in your hand when you hold the crystal (and in your ribcage when it's in your jacket pocket) reminds you of the science experiments you did in your youth, bombarding crystals with various forms of radiation to see how it changed their properties. You don't wonder whether that happened to this one; you merely wonder how.",
		name: "quartz crystal",
		combine:
		{
			clockinsides: "You're sure you can find something better to do with the misbehaving {quartzcrystal} than put it back into the {clockinsides} of the {clock} where you found it.",
			brokencommunicator: "[STATE:garden=commfixed][STATE:clock=done][LOSE:brokencommunicator][LOSE:quartzcrystal][COLLECT:communicator]You flip open a panel on the side of the {communicator} and insert the quartz crystal you took from the lounge clock. Let's see if that works any better."
		}
	},
	shed:
	{
		desc: "The interior of the shed is dark and the air feels slightly damp.",
		things:
		{
			backgarden: "The only exit leads to the {backgarden}.",
			experiments: "Every surface is covered with {experiments} and among them, as well as hanging on the walls, are numerous {familyphotos}.",
			chemicals: "[STATE:shed=chemicals]On a high shelf is a selection of {chemicals} in a range of glass, plastic and metal containers."
		},
		travel:
		{
			backgarden: "You push open the shed door and gingerly step from the {backgarden} into the {shed}. Several spiders, a handful of woodlice and quite possibly a squirrel scurry away, leaving you all alone in the murk."
		}
	},
	shedroof:
	{
		name: "shed roof",
		prefix: "You are on the",
		desc: "The felt-covered roof is weathered but apparently pretty darn strong, considering you're not as young or as light as you used to be.",
		things:
		{
			backgarden: "[STATE:loft=pod]To one side is a {backgarden} full of overgrown lawn and on the other is your {crashedpodlong} surrounded by broken roof tiles.",
			exclusionfield: "Over the fence to the side of you is the rippling {exclusionfield}."
		},
		travel:
		{
			loft: "[KEEPTRAVEL][SET:shedroof.travel.loft=lofttoroof][STATE:garden=garden]You drop down onto the {shedroof}. It buckles slightly but decides that yes, it is going to support your weight. You grab on to stop yourself bouncing straight into the {backgarden}."
		}
	},
	shedrooflong:
	{
		name: "roof of a garden shed",
		alias: "shedroof"
	},
	shinything:
	{ name: "small shiny box thing", alias: "brokencommunicator" },
	sofa:
	{ desc: "The sofa looks and feels battered - not in a culinary sense, you understand, more like it's been pounded all over with hammers for quite a while. You know you sometimes thrash about in your sleep and hope you didn't cause all the {sofacrumples} and {sofadents} and {squeakybits} yourself." },
	sofacreases:
	{      name: "creases",      alias: "sofacrumples"     },
	sofacrumbs:
	{      name: "crumbs and fluff",      desc: "These were once delicious foods and comfy clothes and wonderful people. Now they're worthless debris lost in the folds of a {sofa}. Such is life."     },
	sofacrumples:
	{      name: "crumples",      desc: "So many creases. Poor {sofa}. It looks like a thumb which has spent too long in a bubble bath. A really big thumb in the shape of a {sofa}. And which is dark blue."     },
	sofadents:
	{      name: "dents",      desc: "You prod and poke around the {sofa}'s many dents.",      nothing: "You find nothing except {sofacrumbs}. You don't need any {sofacrumbs}.",      things: {key: "[STATE:sofa=dents]You find a {key} in among the {sofacrumbs}."}     },
	springs:
	{ alias: "squeakybits" },
	squeakybits:
	{      name: "squeaky bits",      desc: "The {sofa} must be full of springs which have had a good innings and then been refused permission to leave the playing field. Poor springs. Let's leave them be."     },
	stairs:
	{
		prefix: "You are on the",
		desc: "At the top of the staircase is the {landing}; at the bottom, the {hallway}.",
		things:
		{
			rail: "[STATE:stairs=seen]At the side of the stairs is a {handrail}."
		},
		travel:
		{
			hallway: "You make your way up the {stairs}. It's pretty dark ahead of you and they creak with every step you take. Rounding a corner you can make out where the top step becomes the dingy {landing}. Oh, the anticipation."
		}
	},
	theend:
	{
		name: "THE END"
	},
	newgame:
	{
		name: "NEW GAME"
	},
	begin:
	{
		name: "BEGIN",
		alias: "newgame"
	},
	continuegame:
	{
		name: "CONTINUE GAME"
	},
	restart:
	{
		name: "RESTART"
	},
	share:
	{
		name: "SHARE"
	},
	tear:
	{
		name: "tear in the fabric of spacetime",
		first: "[SET:tear.travel.backgarden=intotear]You peer into the tear. Inside it - if inside is the word - you see an endless sea of shifting fractals: details within details within details, folding in on each other, expanding, imploding, reaching out towards you. It's hypnotic. # It's drawing you in - and you know you need to let it. Freezing time and popping into your own past undetected is one thing; staying and interacting with it live would result in an avalanche of paradoxes almost immediately. # The {tear} hangs in front of you, waiting for you to step in.",
		desc: "And then there's {nothing}."
	},
	nothing:
	{
		travel:
		{
			tear: "[STATE:final=nearly][SETLASTPROCESSED:thisway]The nothing swirls around and through you, and you around and through it. It's an odd sensation. You might just have to stay here forever. That wouldn't be so bad, would it? You've fixed things now. You don't really need to get home, do you? # The plan, of course, had been to leave through the tear the way you'd arrived - in your drop-pod. Far safer than trying to make your way through the maelstrom protected by little more than a jumpsuit and a jacket and guided by gut instinct. You blew it when you crashed the thing. This is what you get. # In the swirling bit of spacetime that may have once been your memories you keep replaying the message you received from the lab. # <I>&quot;If you need any help, just say...&quot;</I>"
		}
	},
	lab:
	{
		name: "laboratory",
		desc: "The laboratory is bright and clean. Machines communicate without cables, displaying diagnostic information about your time-travel shenanigans. One screen seems to be a tad concerned that you've arrived back in the lab with a misshapen kitchen knife. # On the counter next to you is a {oldcube}.",
		travel:
		{
			nothing: "[STATE:final=box]You emerge from the tear in spacetime into a {lab}. The owner of the voice - your daughter - sits in a lab coat staring at a waveform on a holographic wall. She turns to face you as you collapse to the ground. # <I>&quot;Thought I'd lost you for a second there. Welcome back. Everything OK?&quot;</I> # You lean - and then realising how wobbly you are, sit - on a tall stool next to a {oldcube}. It has a flywheel in it but is otherwise empty, and the axle on which the flywheel used to spin is rusted solid.",
		}
	},
	thisway:
	{
		name: "this way",
		alias: "lab"
	},
	survey:
	{
		name: "THE FLYWHEEL feedback survey",
	},
	oldcube:
	{
		name: "50-year old perspex cube",
		first: "[STATE:final=done][END]You throw and catch the old cube a few times and eventually speak. # <I>&quot;I'm really glad you asked me if I ever found out who fixed this. Thanks for making me run those tests and helping me work out the answer. I just wish I'd known sooner so I didn't have to go back and do it at this age...&quot;</I> # Your daughter smiles. You've told her before you'd have given up trying to design a perpetual motion device had it not miraculously been fixed that day. Now, of course, your design is in vehicles, power stations, space stations, even microscopic versions in long-range communicators and teleporters. Whoever fixed your machine that day changed the world. You just didn't know at the time that it was you. # {WTEndGame:theend}",
	},
	OPTIONS:
	{
		name: "display options"
	},
	letsgo:
	{
		name: "let's go"
	},
	teleporter:
	{ descFunc: RoomGame_DescribeTeleporter, name: "teleporter" },
	toaster:
	{
		desc: "There's something jammed deep in the toaster - the remains of a piece of chunky bread or teacake or something, wedged so firmly between the heating elements that there's no freeing it now.",
		things:
		{
			kitchenknife: "[STATE:toaster=get]Someone's clearly given it a good go though, judging by the {knife} that's sticking out of it."
		}
	}
}
