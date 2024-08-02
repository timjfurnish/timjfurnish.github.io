wt_addProgress('garden', 'air', 'You should get some fresh air into your lungs.')
wt_addProgress('garden', 'garden', "Ah, the great outdoors! That's better! You should have a look around out here.")
wt_addProgress('garden', 'lawn', 'The long grass in the garden could be hiding something.')
wt_addProgress('garden', 'glint', 'You found something glinting in the overgrown lawn. Maybe you should pick it up.')
wt_addProgress('garden', 'comm', 'You found your communicator in the garden. How about using it?')
wt_addProgress('garden', 'commbroken', 'You should fix your broken communicator.')
wt_addProgress('garden', 'commfixed', "You've fixed your communicator; you should see whether it still works.")
wt_addProgress('garden', 'commhigh', "You need to take your communicator somewhere high to use it.")
wt_addProgress('garden', 'commuse', "You can use the communicator to search for more of your missing equipment.")
wt_addProgress('garden', 'flowers', "The communicator made a light flash on something lost in the back garden's flowers.")
wt_addProgress('garden', 'teleport', "You've found a teleporter; you should see if it still functions.")
wt_addProgress('garden', 'done', "Your teleporter still functions! You can use it to hop between all the places that it's seen.")
wt_addProgress('garden', 'hide')

wt_addProgress('toaster', 'look', "There's probably something useful in the kitchen. There's always something useful in a kitchen, right?")
wt_addProgress('toaster', 'get', "There's a knife in the toaster. Don't worry, the power's off.")
wt_addProgress('toaster', 'knife', "You've found a knife. You should maybe examine it.")
wt_addProgress('toaster', 'screwdriver', "You've found a knife. The end's misshapen - it looks like a screwdriver.")
wt_addProgress('toaster', 'done')

wt_addProgress('clock', 'odd', "You have a feeling there's something odd about the clock in the lounge.")
wt_addProgress('clock', 'backwards', "The clock in the lounge seems to be running backwards.")
wt_addProgress('clock', 'screws', "A panel on the back of the lounge clock is held in place with screws.")
wt_addProgress('clock', 'open', "The knife you found can unscrew the panel on the back of the lounge clock.")
wt_addProgress('clock', 'crystal', "You've taken the malfunctioning quartz crystal from the lounge clock.")
wt_addProgress('clock', 'done')

wt_addProgress('sofa', 'sleep', "You've seen a photo of the young inventor asleep on the sofa, contents spilling from pockets.")
wt_addProgress('sofa', 'dents', "There's a key lost among the dents of the lounge sofa.")
wt_addProgress('sofa', 'key', "You found a key. You haven't yet found what it locks or unlocks.")
wt_addProgress('sofa', 'done')

wt_addProgress('loft', 'locked', "The loft hatch is locked.")
wt_addProgress('loft', 'open', "You've unlocked the loft hatch. You can now get into the loft.")
wt_addProgress('loft', 'roof', 'Something made a big hole in the roof of the house. Looks like it landed outside somewhere.')
wt_addProgress('loft', 'pod', "Looks like the hole in the roof was made by you crashing a drop-pod through the house. Oops.")
wt_addProgress('loft', 'inpod', "You've got into the drop-pod that you crashed straight through the house.")
wt_addProgress('loft', 'opening', "You revealed an opening in the side of the engine in the crashed drop-pod.")
wt_addProgress('loft', 'fast', "You can use the engine in the crashed drop-pod to make the flywheel spin incredibly fast.")
wt_addProgress('loft', 'done')

wt_addProgress('shed', 'seen', "There's an unexplored shed in the garden.")
wt_addProgress('shed', 'chemicals', "The shed contains several interesting looking chemicals.")
wt_addProgress('shed', 'done')

wt_addProgress('bedroom', 'seen', "There's a bedroom door on the landing.")
wt_addProgress('bedroom', 'stuck', "There's a bedroom door on the landing but the handle won't turn.")
wt_addProgress('bedroom', 'open', "You've knocked the handle off the bedroom door.")
wt_addProgress('bedroom', 'in', "You've got into the bedroom. Take another look around!")
wt_addProgress('bedroom', 'machine', "You've found a broken perpetual motion device in the bedroom.")
wt_addProgress('bedroom', 'box', "The perspex box fits into the perpetual motion device in the bedroom.")
wt_addProgress('bedroom', 'done')

wt_addProgress('letter', 'seen', "There's a letter in the bedroom. Maybe reading it would be useful.")
wt_addProgress('letter', 'read', "The letter in the bedroom said a piece of machinery was thrown down the stairs.")
wt_addProgress('letter', 'gotbox', "You found a perspex box containing a flywheel on the floor at the bottom of the stairs.")
wt_addProgress('letter', 'bubbles', "The oily liquid in the perspex box has been ruined by the sun.")
wt_addProgress('letter', 'oilchange', "You replaced the oily liquid in the perspex box.")
wt_addProgress('letter', 'better', "The flywheel spins much better after you replaced the oily liquid in the perspex box.")
wt_addProgress('letter', 'stop', "The flywheel only spins for a while - eventually it slows down and stops.")
wt_addProgress('letter', 'done')

wt_addProgress('diary', 'out', "You found a diary in the bedroom and put it on the desk.")
wt_addProgress('diary', 'read', "You read in the diary that the machine in the bedroom is invention " + s_correctCode + ".")
wt_addProgress('diary', 'used', "You successfully entered the code " + s_correctCode + " into the console in the crashed drop-pod.")
wt_addProgress('diary', 'done')

wt_addProgress('final', 'send', "You should let the lab know you've fixed the machine.")
wt_addProgress('final', 'out', "Have you heard anything back from the lab after your final mission update?")
wt_addProgress('final', 'go', "Time to go. You saw a huge flash of light in the garden.")
wt_addProgress('final', 'keepgoing', "Keep going.")
wt_addProgress('final', 'nothing')
wt_addProgress('final', 'nearly', "Listen.")
wt_addProgress('final', 'box', "There's something in the lab which you should recognise from your adventure.")
wt_addProgress('final', 'done')

wt_addProgress('stairs', 'seen', 'Walking downstairs is sooo boring. Is there a quicker way to get down to the hallway?')
wt_addProgress('stairs', 'broken', 'Oops! You broke the hand-rail! Now what?')
wt_addProgress('stairs', 'got', 'You got a banister from the broken hand-rail. What does it look like?')
wt_addProgress('stairs', 'bat', 'You got a banister from the broken hand-rail. It look like a baseball bat.')
wt_addProgress('stairs', 'done')

function BoomAddExtraHints(arrOut)
{
	if (kObjects.engineopening.things.flywheelbox)
	{
		arrOut.push("You've left the flywheel in a perspex box in the engine in the crashed drop-pod.")
	}
	else if (kObjects.pmm.things.flywheelbox)
	{
		arrOut.push("You've left the flywheel in a perspex box in the machine in the bedroom.")
	}
}

//=======================
// Initial state...
//=======================

WTSetExtraHintFunc(BoomAddExtraHints)

//=======================
// For comms...
//=======================

kStrings.comms_garden_teleport = "I found my old teleporter! I should probably check whether it still works."
kStrings.comms_garden_done = "I got my old teleporter working again! That was pretty cool."

kStrings.comms_bedroom_seen = "I've found the bedroom door. Which reminds me! I never did try to open it. I should go and do that."
kStrings.comms_bedroom_stuck = "the bedroom door handle won't turn. I'm wondering how to open it."
kStrings.comms_bedroom_in = "I've got into the bedroom! Going to go and explore in there some more."
kStrings.comms_bedroom_machine = "I've had a quick look around in the bedroom. Found a machine. Now I need to fix it."
kStrings.comms_bedroom_done = null

kStrings.comms_loft_roof = "something crashed straight through the roof and I have a horrible feeling it was me."
kStrings.comms_loft_pod = "I found my crashed drop-pod. It's pretty banged up. I think I smashed it straight through the house."
kStrings.comms_loft_fast = "I powered up the flywheel I've been carrying around using the engine in the crashed drop-pod."
kStrings.comms_loft_done = "I put the powered-up flywheel into the perpetual motion machine I found."

kStrings.comms_letter_gotbox = "I found a bit of machinery at the bottom of the stairs. It's a flywheel in a clear plastic box."
kStrings.comms_letter_done = null
