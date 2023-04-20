let s_unsentMsg = "PQ to lab! The reverse thrusters have failed! It's going to be a bumpy landing! But I can report we got the coordinates and the date spot on - I can see the house below me and the sensors indicate that nobody's home. The pod's set up to create an exclusion field once it's close enough to the ground. I'm strapped in and braced for impact. I'll message again once I'm out of this thing!"
let s_firstMsg = "PQ checking in! Had a bumpy landing, needed to sleep it off while my suit patched me up. A few days at least, possibly weeks. But I'm mostly fixed and back on my feet. Plus"
let s_finalMsg = "I've done it. I got the machine running and I've tagged it so it won't reset with everything else. I'm ready to go."
let s_commsOpener = new Array("Here's my update -", "Got another progress update for you. Ready? Check this out -", 'OK,', 'Well,', 'So', "Here's something new -", "Here's my latest news -", "I should let you know")
let s_commsJoiner = new Array('What else? Um,', 'Also', 'And', "Oh! And", "Now, let me think... oh,", "Plus", "And here's another thing -")
let s_commsCloser = new Array("And that's my news!", "I'll be in touch again soon!", "Message ends. PQ out!", "I'll keep you posted about any other progress!")
let s_quips = new Array("It occurs to you - not for the first time - how odd it is that you can send messages forwards in time before realising - not for the first time - that really it's just a question of storage.")
let s_reportCounter = 0
let s_lastReport = new Object()
let s_commIntro = "Your long-range communicator is dented and damaged but thanks to your tinkering it's working again. You grin from ear to ear. Still got it."

function RoomGame_CommIsUsable()
{
	let reply = false
	
	if (s_wtPrevObject == "loft")
	{
		if (wt_progressReached('final', 1))
		{
			// Nothing left to say... but return true if not heard incoming message
			reply = wt_progressReached('final', 2)
		}		
		else if (wt_progressCompleted('letter'))
		{
			// Only final message left to send
			reply = true
		}
		else
		{
			let toHere = new Array()
			GatherOutgoingMessageBits(toHere, false)
			reply = toHere.length > 0
		}
	}
	
	// WTDebug("Called CommIsUsable, prev=" + s_wtPrevObject + ", returning " + reply)
	return reply
}

function RoomGame_DescribeCommDevice(arrOut, objID)
{
	if (WTGetLocation() == "loft")
	{
		let desc = "your communicator aloft you see the"
		let extraBit = ""
		
		if (s_commIntro)
		{
			WTAddChunk(s_commIntro, arrOut)
			WTAddChunk('#', arrOut)
			desc = "it aloft to get the best signal you're pleased to see the familiar three-button"
 			extraBit = " - in your case,"
 		}

		WTAddChunk("[STATE:garden=commuse]Holding " + desc + " interface light up: the {comminbox} for checking your incoming messages, the {commtracker} for locating your other assigned devices and the {commsend} for sending new messages" + extraBit + " back to the lab.", arrOut)
		
		if (wt_progressReached('final', 1) && !wt_progressReached('final', 2))
		{
			WTAddChunk("#", arrOut)
			WTAddChunk("The {comminbox} is blinking.", arrOut)
		}
	}
	else
	{
		if (s_commIntro)
		{
			WTAddChunk(s_commIntro + " Sadly the display", arrOut)
		}
		else
		{
			WTAddChunk("The display on your communicator", arrOut)
		}
		WTAddChunk("[STATE:garden=commhigh]shows that the signal it's receiving isn't strong enough. If memory serves you'll need to find an elevated position with line of sight to whatever satellites might be up there.", arrOut)
	}
	
	s_commIntro = null
}

function RoomGame_CommInbox(arrOut, objID)
{
	if (wt_progressReached('final', 1))
	{
		if (wt_progressReached('final', 2))
		{
			WTAddChunk("You have no further messages from the lab.", arrOut);
		}
		else
		{
			WTAddChunk("[STATE:final=go]You push the flashing {comminbox} to hear the message you've received.", arrOut);
			WTAddChunk("#", arrOut)
			WTAddChunk("<I>&quot;Hi, Gax. It's about 12 seconds after you left here. I've just unlocked and listened to your mission report" + (s_firstMsg ? "" : "s") + ". Good job! I mean, we both knew you'd do it - you explained the logic behind that. It still blows my mind to be honest. Anyway, well done! I'll arrange for your collection. See you soon - and if you need any help, just say!&quot;</I>", arrOut);
			WTAddChunk("#", arrOut)
			WTAddChunk("[SET:backgarden.desc=wayout]A split-second after the message ends there is a flash of aquamarine light from outside. The flash subsides (or your vision recovers, it's hard to tell) and you make your way towards the missing end of the loft to peer at the towering anomaly that has appeared in the garden. Your work here is done.", arrOut);
		}
	}
	else
	{
		WTAddChunk("You push the {comminbox} on the {communicator}, wondering if you've had any messages from the lab. But you haven't - your inbox is empty.", arrOut);
	}
}

function GatherOutgoingMessageBits(msgContents, markAsSent)
{
	const keys = Object.keys(g_myProg)
	for (const key of keys)
	{
		let c = g_progress[key]
		let m = g_myProg[key]
		let highestNum = -1
		let highestComment = null

		const states = Object.keys(c)
		
		for (const state of states)
		{
			let obj = c[state]

			if (typeof(obj) === "object" && m.value >= obj.value && obj.value > highestNum)
			{
				let findById = "comms_" + key + "_" + state
				let comment = kStrings[findById]

				if (comment)
				{
					highestComment = comment
					highestNum = obj.value
				}
			}
		}
		
		if (highestNum != s_lastReport[key])
		{
			if (markAsSent)
			{
				s_lastReport[key] = highestNum
			}

			if (highestComment)
			{
//				WTDebug("My '" + key + "' progress is '" + m.stateName + "' (" + m.value + ") - " + highestComment)

				if (msgContents.length != 0)
				{
					let rot = s_commsJoiner.shift()
					msgContents.push(rot)
					s_commsJoiner.push(rot)
				}
				msgContents.push(highestComment);
			}
		}
	}
}

function RoomGame_CommSend(arrOut, objID)
{
	let msgContents = new Array()
	let after = null

	if (s_unsentMsg)
	{
		WTAddChunk("You prod the {commsend} on the {communicator} to compose a message but discover the last one you recorded never got sent. So you listen to it:", arrOut);
		after = "You delete the unsent message. You can record another, better one by pressing the {commsend} again."
		msgContents.push(s_unsentMsg)
		s_unsentMsg = null
	}
	else if (wt_progressCompleted('letter'))
	{
		if (wt_progressReached('final', 1))
		{
			WTAddChunk("Your finger hovers over the {commsend} on the {communicator}. But you don't have anything else to report.", arrOut);
			return
		}
		else
		{
			WTAddChunk("[STATE:final=out]You hold the {commsend} and, after a few moments, record the following.", arrOut);
			let finalMaybe = s_firstMsg ? "" : "final "
			after = "You send your " + finalMaybe + "message. If you're right they'll be back in touch pretty much immediately."
			msgContents.push("Lab, this is Phoegax Quantify's " + finalMaybe + "mission report.")
			msgContents.push(s_finalMsg)
		}
	}
	else
	{
		GatherOutgoingMessageBits(msgContents, true)

		if (msgContents.length == 0)
		{
			WTAddChunk("You prod the {commsend} on the {communicator} and start recording a message, but you can't think what to say so cancel the recording.", arrOut);
			return;
		}

		let closer = s_commsCloser.shift()
		s_commsCloser.push(closer)
		msgContents.push(closer);
		
		if (s_firstMsg)
		{
			WTAddChunk("You practice your message a few times, then jab the {commsend} and record it:", arrOut);
			after = "You send the message. The {communicator} briefly displays a tick to show that it's been sent successfully."
			msgContents.unshift(s_firstMsg)
			s_firstMsg = null
		}
		else
		{
			after = "You send the message."

			if (s_quips.length && msgContents.length <= s_reportCounter + 1)
			{
				after += " # " + s_quips.pop()
			}

			let opener = s_commsOpener.shift()
			s_commsOpener.push(opener)
			msgContents.unshift("Mission report - addendum " + (++ s_reportCounter) + ". " + opener)
			WTAddChunk("You hold the {commsend} on the {communicator} and record another message.", arrOut);
		}
	}

	WTAddChunk("#", arrOut)
	WTAddChunk("<I>&quot;" + msgContents.join(' ') + "&quot;</I>", arrOut);
	
	if (after)
	{
		WTAddChunk("#", arrOut)
		WTAddChunk(after, arrOut)
	}
}
