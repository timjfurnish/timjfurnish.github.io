var s_hours = 4, s_minutes = 37, s_timesSeenClock = 0, s_brokenHandRail = false, s_knowFlowers = false, s_timesTeleported = 0
var s_teleportDestinations = {backgarden: 1}
var s_flywheelSpeed = 0
var s_flywheelText = new Array('really slowly', 'quite slowly', 'quite fast', 'really fast', "incredibly fast", "so fast it's a blur")
var s_typedCode = "", s_correctCode = '1352', s_engineUnlocked = false

WTSetCallback('post', RoomGame_Post)
WTSetCallback('tick', RoomGame_Tick)
WTSetCallback('travel', RoomGame_Travel)

//====================
// Custom object description functions
//====================

function RoomGame_CommTracker(arrOut, objID)
{
	WTAddChunk("You jab the {commtracker} and wander around what's left of the {loft} pointing your {communicator} around in all directions.", arrOut);

	if (WTInventoryContains("teleporter"))
	{
		WTAddChunk("It finds nothing except the {teleporter} which currently resides in your jacket pocket and which simultaneously lights up through the fabric.", arrOut)
	}
	else if (s_knowFlowers)
	{
		WTAddChunk("Again, the only device it finds is something hidden among the flowers in the garden. And again, the thing in the flowers glows back.", arrOut)
	}
	else
	{
		WTAddChunk('#', arrOut)
		WTAddChunk("[STATE:garden=flowers][SET:flowers.desc=flowersteleporter]At first it finds nothing - but then it bleeps. And again - every time you sweep it past a particular patch of flowers in the garden. At the same time, something in among the flowers lights up, showing you its exact location.", arrOut)
		s_knowFlowers = true
	}
}

function RoomGame_DescribeFlyWheelBox(arrOut, objID)
{
	if (WTInventoryContains("flywheelbox"))
	{
		if (s_flywheelSpeed >= 2)
		{
			WTAddChunk("You watch the flywheel spinning in the oily liquid. It's moving " + s_flywheelText[s_flywheelSpeed - 1] + " and slowing over time - but it seems to slow down more rapidly the more you move.", arrOut)
		}
		else if (wt_progressCompleted("shed"))
		{
			WTAddChunk("[STATE:letter=better]Shaking the box creates a small whirlpool in the oily fluid. The flywheel spins and spins. That oil change did it a world of good.", arrOut)
			s_flywheelSpeed = 3
		}
		else
		{
			WTAddChunk("[STATE:letter=bubbles]Shaking the box creates clouds, bubbles and a small whirlpool in the oily fluid. The flywheel spins for a few seconds but then stops. And no wonder: the liquid's not meant to bubble like that. This should never have been left in the sunlight.", arrOut)
		}
	}
	else if (kObjects.engineopening.things.flywheelbox)
	{
		WTAddChunk("[COLLECT:flywheelbox][DELETE:engineopening.things.flywheelbox]You pull the {flywheelbox} from the {engineopening} and hold it in your hand.", arrOut)

		if (wt_progressCompleted("shed"))
		{
			WTAddChunk("[STATE:loft=fast]Thanks to its oil change there are no bubbles and the flywheel keeps on spinning.", arrOut)
			s_flywheelSpeed = 7
		}
		else
		{
			WTAddChunk("The flywheel spins for a few seconds but then stops. The bubbles in the liquid are ruining its ability to retain its momentum.", arrOut)
		}
	}
	else if (wt_progressCompleted("loft"))
	{
		WTAddChunk("The perspex box is now powering the {pmm} - or possibly the other way around. It's all a bit symbiotic.", arrOut)
	}
	else
	{
		WTAddChunk("The box is attached to the motionless {pmm}. A small {pmmswitch} has popped up next to it marked RELEASE in fine marker pen.", arrOut)
	}
}

function RoomGame_DescribeTeleporter(arrOut, objID)
{
	let location = WTGetLocation()

	if (location == "bedroom")
	{
		if (wt_progressCompleted("letter") && !wt_progressReached("final", 0))
		{
			WTAddChunk("You're not ready to leave the {bedroom} just yet. You have one thing left to do.", arrOut)
			return
		}
	}
	
	if (location == "clockinsides")
	{
		WTAddChunk(kObjects.lounge.travel.clockinsides, arrOut)
		WTAddChunk("#", arrOut)
		location = "lounge"
		WTSetLocation(location)
	}

    var list = new Array()
    var prev = null

    for (objId in s_teleportDestinations)
    {
    	if (location != objId)
    	{
	        if (prev)
    	    {
        	    list.push(prev)
	        }
    	    prev = objId   
    	}
    }
    
    WTAddChunk("[TREATASPREVLOCATION]A rough holographic map glimmers in the air as you hold the teleportation device up in front of you.", arrOut)

	if (prev == null)
	{
        WTAddChunk("It shows only your current location. You've heard stories about people accidentally teleporting to their current location and do not want to experience that yourself.", arrOut)
	}
    else if (list.length)
    {
        WTAddChunk("As well as your current location it shows the relative positions of the {" + list.join("}, {") + "} and {" + prev + "}.", arrOut)
    }
    else
    {
        WTAddChunk("It's not exactly a large map; other than your current location the device only knows about the {" + prev + "}.", arrOut)
    }
}

function RoomGame_UseHandRail(arrOut, objID)
{
	if (WTInventoryContains("banister"))
	{
		WTAddChunk("[LOOKATROOM]You've already taken a banister from beneath the broken hand-rail. You doubt you'd need a second. To be honest, you doubt you'll need the first.", arrOut)
	}
	else if (s_brokenHandRail)
	{
		WTAddToInventory("banister")
		WTAddChunk("[STATE:stairs=got][LOOKATROOM]With the {handrail} now completely broken the banisters are pointing in a variety of directions. One in particular looks like a real tripping hazard so you remove it. Besides, you never know when a hefty {banister} might come in handy.", arrOut)
	}
	else
	{
		WTSetLocation("hallway")
		s_brokenHandRail = true
		kObjects.handrail.name = "broken hand-rail"
		WTAddChunk("[STATE:stairs=broken]You slide down the hand-rail all the way to the {hallway} - or at least, that's your intention. In reality it breaks half way and you fall onto the floor in a heap at the bottom of the {stairs}; the awful {hallwaycarpet} offers all the protection of a sheet of newspaper.", arrOut)
	}
}

function RoomGame_DescribeClock(arrOut, objID)
{
	const padHour = (s_hours < 10) ? '0' : ''
	const padMinute = (s_minutes < 10) ? '0' : ''
        
    if (! kObjects.clockinsides.things.quartzcrystal)
    {
    	const desc = (WTGetLocation() == "clockinsides") ? "tinkering with the {clockinsides} of the clock" : "taking the {clockback} off the clock and tinkering with the insides"
        WTAddChunk("Since " + desc + " the hands have stopped at " + padHour + s_hours + ':' + padMinute + s_minutes + ". Was it really running backwards or did you imagine it? You scratch your {head}.", arrOut)
    }
    else
    {
		WTAddChunk("The {clock} reliably informs you that it's " + padHour + s_hours + ':' + padMinute + s_minutes + '.', arrOut)

	    if (s_timesSeenClock == 2)
	    {
	    	if (WTGetLocation() == "clockinsides")
	    	{
		        WTAddChunk("It's still running backwards, and with the panel removed from the back exposing the {clockinsides} the ticks are louder than before.", arrOut)
		    }
		    else
		    {
		        WTAddChunk("The clock is still running backwards. Once again you strongly consider investigating the {clockback}.", arrOut)
		    }
	    }
	    else
	    {
	        ++ s_timesSeenClock

	        if (s_timesSeenClock == 2)
			{
	            WTAddChunk("[STATE:clock=backwards]That's odd. The clock must be running backwards. Perhaps you should look at the {clockback}.", arrOut)
	        }
        }
    }
}

function RoomGame_PodButton(arrOut, objID)
{
	s_typedCode = s_typedCode + objID.substr(-1)
	let showThis = s_typedCode
	let wasLocked = s_engineUnlocked

	if (s_typedCode.length >= 4)
	{
		if (s_typedCode == s_correctCode)
		{
			showThis += " - ACCESS GRANTED"
			s_engineUnlocked = true
		}
		else
		{
			showThis += " - ACCESS DENIED"
			s_engineUnlocked = false
		}

		s_typedCode = ""
	}

	kObjects.buttons.nothing = "# The screen above the buttons reads &quot;" + showThis + "&quot;."

	WTAddChunk(kObjects.buttons.desc, arrOut)
	WTAddChunk(kObjects.buttons.nothing, arrOut)
	
	if (s_engineUnlocked != wasLocked)
	{
		if (s_engineUnlocked)
		{
			WTAddChunk("[STATE:diary=used][SET:engine.things.engineopening=engineopening]From the direction of the {engine} you hear the THONK of something unlocking.", arrOut)
		}
		else
		{
			WTAddChunk("[DELETE:engine.things.engineopening]From the direction of the {engine} you hear the CLANG of something locking.", arrOut)
		}
	}
}

//====================
// CALLBACKS...
//====================

function RoomGame_Tick()
{
    if (kObjects.clockinsides.things.quartzcrystal)
	{
//		WTDebug ("s_minutes=" + s_minutes + ", s_hours=" + s_hours + ", s_timesSeenClock=" + s_timesSeenClock)
		-- s_minutes
		if (s_minutes < 0)
		{
			s_minutes = 59
			-- s_hours
			if (s_hours < 0)
			{
				s_hours = 23
			}
		}
	}
}

function RoomGame_Post(arOut)
{
	if (s_flywheelSpeed)
	{
		if (WTInventoryContains("flywheelbox"))
		{
			-- s_flywheelSpeed

			if (s_flywheelSpeed)
			{
				WTAddChunk("# The flywheel is spinning " + s_flywheelText[s_flywheelSpeed - 1] + ".", arOut)
			}
			else
			{
				WTAddChunk("# [STATE:letter=stop]The flywheel has stopped spinning.", arOut)
			}
		}
		else
		{
			s_flywheelSpeed = 0

			if (kObjects.pmm.things.flywheelbox)
			{
				WTAddChunk("# [STATE:diary=done][STATE:letter=done][STATE:loft=done][STATE:bedroom=done][DELETE:pmm.things.flywheelbox][DELETE:pmm.nothing][SET:pmm.desc=pmmfixed][SET:bedroom.things.pmm=pmmworking][SET:bedroom.first=inclusion]The flywheel - now clicked into place in the {pmm} - starts to accelerate.", arOut)
			}
		}
	}
}

function RoomGame_Travel(fromHere, toHere, arOut)
{
	if (s_wtPrevObject == "teleporter")
	{
		if (s_timesTeleported == 2)
		{
			WTAddChunk("You breathe in, close your eyes, squeeze the trigger and teleport back to the {" + toHere + "}. It takes a second to regain your balance.", arOut)
		}
		else if (s_timesTeleported == 1)
		{
			s_timesTeleported = 2
			WTAddChunk("OK, here we go: deep breath, pulsating energy bubble, pull in arms and legs and head, squeeze the trigger, hello {" + toHere + "}. Yep, this old {teleporter} thing definitely still works.", arOut)
		}
		else
		{
			s_timesTeleported = 1
			WTAddChunk("[STATE:garden=done]You take a deep breath, hope that the {teleporter} still functions and activate it. The familiar pulsating energy bubble expands around you and you pull in your arms, legs and head to make sure you're completely contained. The machine emits a double beep to let you know that it's ready and you squeeze the trigger, your view briefly turning the brightest of whites as you are disassembled and reassembled at the molecular level. And then it's over - it's transported you safely to the {" + toHere + "} and you've not lost so much as a finger or an ear this time.", arOut)
		}

		return true		
	}
	
	if (WTInventoryContains("teleporter"))
	{
		s_teleportDestinations[toHere] = 1
	}
	
	return false
}