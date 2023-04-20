var s_wtCurLoc
var s_wtClickedObject
var s_wtPrevObject = "intro"
var s_wtCarriedThings = new Object()
var s_wtCallbacks = new Object()
var s_wtDebug = new Array()
var s_wtOptions
let g_linksOnScreen = new Object()
let s_history = new Array()
let s_lastTextPrepared = null
let s_fakeLastTextPrepared = null
let s_justAutoCollected = null
const s_paragraphBreak = '<SMALL><SMALL><BR><BR></SMALL></SMALL>'

//-------------------------------------
// TODO: Move into debug
//-------------------------------------

let s_randomWander = false
let s_timesClicked = new Object()

//-------------------------------------
// Callbacks
//-------------------------------------

function WTSetCallback(cb, func)
{
    s_wtCallbacks[cb] = func
}

//-------------------------------------
// Display
//-------------------------------------

function WTSetAlignment(al)
{
	document.getElementById('TEXTAREA').style.textAlign = al
}

//-------------------------------------
// Inventory functions
//-------------------------------------

function WTAddToInventory(id)
{
	s_wtCarriedThings[id] = true
	if ("collect" in kObjects[id])
	{
		WTDebug("Adding " + id + " to inventory and deleting '" + id + ".collect'")
        delete kObjects[id].collect
	}
	else
	{
		WTDebug("Adding " + id + " to inventory (object had no 'collect' member)")
	}
}

function WTInventoryContains(id)
{
	return s_wtCarriedThings[id] ? true : false
}

function WTRemoveFromInventory(id)
{
	if (id == '*')
	{
		s_wtCarriedThings = new Object()
	}
	else if (s_wtCarriedThings[id])
	{
		WTDebug("Removing " + id + " from inventory")
		delete s_wtCarriedThings[id]
	}
	else
	{
		WTDebug("There's no " + id + " in the inventory")
	}
}

//-------------------------------------
// Location functions
//-------------------------------------

function WTGetLocation()
{
	return s_wtCurLoc
}

function WTSetLocation(id)
{
	WTDebug("Changing current location from " + s_wtCurLoc + " to " + id)
	s_wtCurLoc = id

	let obj = kObjects[id]

	if (obj)
	{
		obj.clicked = true
	}
	else
	{
		WTError("Just set location to invalid item ID '" + id + "'")
	}
}

function WTOnEnterPlace(fromId, id, objData, arOut)
{
	var bDescribeRoom = true
	var bJustContents = false
	var travelList = objData.travel

	WTDebugPush('entering ' + id)
	WTSetLocation(id)
	
    if (s_wtCallbacks.travel && s_wtCallbacks.travel(fromId, id, arOut))
    {
		bDescribeRoom = s_wtOptions.LOOKATROOM
    }
    else if (travelList && fromId in travelList)
    {
        var travel = travelList[fromId]
		WTAddChunk(travel, arOut)
		if (!s_wtOptions.KEEPTRAVEL)
		{
	        delete travelList[fromId]
		}
		bDescribeRoom = s_wtOptions.LOOKATROOM
		bJustContents = true
	}
    else
    {
        WTAddChunk("You return to the {" + s_wtCurLoc + "}.", arOut)
        s_wtOptions.LOCATIONMENTIONED = true
    }
    
    if (bDescribeRoom)
    {
        WTDescribeObjectInfo(objData, id, arOut, bJustContents)
    }

	WTDebugPop()
}

//-------------------------------------
// Options - call from game code
//-------------------------------------

function WTAddOption(match, p1)
{
	WTDebugPush('"' + p1 + '"')
	let reply = null

	var bits = p1.split(':')
	
	if (bits.length == 1)
	{
		WTDebug("Setting flag '" + p1 + "'")
		s_wtOptions[p1] = true
	}
	else if (bits.length == 2)
	{
		var func = s_wtCmdList[bits[0]]
		if (func)
		{
			reply = func(bits[1])
		}
		else
		{
			WTError("Can't call invalid command '" + bits[0] + "' with param '" + bits[1] + "'")
		}
	}

	WTDebugPop()
	return reply ? reply : ''
}

function WTAddChunk(text, arOut)
{
	text = text.replace(/\[([A-Za-z0-9_\.:\*=&]+)\]/g, WTAddOption)
	
	if (text != '')
	{
		arOut.push(text)
	}
}

function WTClick(id, verb)
{
	if (event && !verb)
	{
		const objData = kObjects[id]
		const verbs = objData.verbs
		
		if (verbs)
		{
			const keys = Object.keys(verbs)
			if (keys.length == 1)
			{
				verb = keys[0]
			}
			else
			{
				WTOpenVerbCoin(event.clientX, event.clientY, id, verbs)
				return
			}
		}
	}

	s_wtDebug = new Array()

	let formatted = WTFollowLink(id, verb)

	if (formatted != null)
	{
	    WTShowText(formatted)
    	WTStorage_WriteHistory(s_history)
    	WTSaveProgressIfRequired()
		WTTimerSave()
	}
}

function WTAutomatedClick(id)
{
	s_wtDebug = new Array()

	let formatted = WTFollowLink(id)

	if (formatted != null)
	{
	    WTShowText(WTPrepareText(s_lastTextPrepared))
	}
}

function WTAutoCollect(container, id, objData, arOut)
{
	WTDebugPush("AutoCollect")
	WTDebug("Removing " + id + " from " + (objData.location ? objData.location : s_wtPrevObject))
	WTAddChunk(objData.collect, arOut)

	s_justAutoCollected = id

	if (s_wtCallbacks.collect && s_wtCallbacks.collect(id, objData, arOut))
	{
		WTDebug("Collection of " + id + " handled by callback")
	}
	else if (! s_wtOptions.NOTINTOINVENTORY)
	{
		s_wtCarriedThings[id] = true
	}

	delete objData.collect
	if (objData.verbs)
	{
		delete objData.verbs.collect
	}
	delete objData.location
	delete container[id]

	WTDebugPop()
}

function WTFollowLink(id, verb)
{ 
    if (! (id in kObjects))
    {
		WTError("There's no object with ID '" + id + "'")
		return null
	}
	else if (! (id in g_linksOnScreen))
	{
		WTError("There's no link to object ID '" + id + "' on the screen, got (" + Object.keys(g_linksOnScreen) + ")\n\n" + s_lastTextPrepared)
		return null
	}

	let storeThis = verb ? id + "@" + verb : id
	WTDebugPush(s_history.length + "=" + storeThis)

	s_justAutoCollected = null
	g_linksOnScreen = new Object()
	s_history.push(storeThis)

	let pair = s_wtPrevObject + ":" + id
	let oldTimesClicked = s_timesClicked[pair]
	let newVal = oldTimesClicked ? (oldTimesClicked + 1) : 1
	s_timesClicked[pair] = newVal

    let objData = kObjects[id]
    objData.clicked = true

    let arOut = new Array()
    let mentionLocation = true
    s_wtOptions = new Object()
    s_wtClickedObject = id
    let verbName = "verb_" + (verb ? verb : "auto")
	s_wtOptions[verbName] = true 

    if (s_wtCallbacks.tick)
    {
        s_wtCallbacks.tick()
    }

	const customFromVerb = objData[verbName]

	if (customFromVerb)
	{
		WTAddChunk(customFromVerb, arOut)
	}
	else
	{
		let canCollect = (s_wtOptions.verb_auto || s_wtOptions.verb_collect) && objData.collect
		let location = objData.location ? objData.location : s_wtPrevObject

		if ('travel' in objData)
		{
			mentionLocation = false
			if (s_wtCurLoc != id)
			{
				WTOnEnterPlace(s_wtCurLoc, id, objData, arOut)
			}
			else
			{
				WTDescribeObjectInfo(objData, id, arOut, false)
			}
		}
		else if (canCollect && ("things" in kObjects[location]) && (id in kObjects[location].things))
		{
			WTAutoCollect(kObjects[location].things, id, objData, arOut)
		}
		else if (canCollect && ("contents" in kObjects[location]) && (id in kObjects[location].contents))
		{
			WTAutoCollect(kObjects[location].contents, id, objData, arOut)
		}
		else
		{
			if (s_wtOptions.verb_collect)
			{
				WTError("Verb was 'collect' but couldn't find '" + id + "' in " + (objData.location ? "its" : "your") + " current location '" + location + "'")
			}

			WTDescribeObjectInfo(objData, id, arOut, false)
		}
	}
	
	if (arOut.length)
	{
		WTAddChunk('#', arOut)
	}

	if (s_wtOptions.END)
	{
		WTTimerStop()
		s_wtOptions.NOINVENTORY = true
	}
	else
	{
		if ((mentionLocation || s_wtOptions.YOUAREHERE) && ! s_wtOptions.NOLOCATION)
		{
			if (objData.location && objData.location != s_wtCurLoc)
			{
				const locationTxt = kObjects[objData.location].objectIsHere
				if (locationTxt)
				{
					WTAddChunk("The {" + id + "} " + locationTxt, arOut)
					WTAddChunk("#", arOut)				
				}
			}

			const ob = kObjects[s_wtCurLoc]
			if (ob)
			{
				const prefix = ob.prefix ? ob.prefix : s_wtSettings.defaultPrefix
				if ("locationText" in ob)
				{
					WTAddChunk(prefix + " " + ob.locationText + ".", arOut)
				}
				else
				{
					WTAddChunk(prefix + " {" + s_wtCurLoc + "}.", arOut)
				}
			}
			else
			{
				WTError("There's no object called '" + s_wtCurLoc + "'")
			}
		}
	}

	if (! s_wtOptions.NOINVENTORY)
	{
		WTListInventory(arOut)
	}

    if (s_wtCallbacks.post)
    {
        s_wtCallbacks.post(arOut)
    }

    s_wtPrevObject = id
    let response = WTPrepareText(arOut.join(" "))
   	WTDebugPop()
	return response
}

function WTBuildStringForContents(arr)
{
    var list = new Array()
    var prev = null

    for (objId in arr)
    {
        if (prev)
        {
            list.push(prev)
        }
        
        let obInfo = kObjects[objId]
        if (obInfo && obInfo.inventoryText)
        {
        	prev = obInfo.inventoryText
        }
        else
        {
	        prev = "a {" + objId + "}"
	    }
    }
    
    return list.length ? list.join(", ") + " and " + prev : prev
}

function WTListInventory(arOut)
{
	const list = WTBuildStringForContents(s_wtCarriedThings)
	
	if (list)
	{
	    WTAddChunk("You are carrying " + list + ".", arOut)
    }
}

function WTDescribeObjectInfo(placeInfo, id, arOut, justContents)
{
	if (s_wtCallbacks.combine && s_wtCallbacks.combine(id, arOut))
	{
		return
	}

	if (id in s_wtCarriedThings)
	{
		if ('combine' in placeInfo)
		{
			if (s_wtPrevObject in placeInfo.combine)
			{
		   		WTDebugPush("combine with " + s_wtPrevObject)
                WTAddChunk(placeInfo.combine[s_wtPrevObject], arOut)
				WTDebugPop()
                return
            }
        }
    }

	if (placeInfo.first)
	{
   		WTDebugPush("first")
		WTAddChunk(placeInfo.first, arOut)
		delete placeInfo["first"]
		WTDebugPop()
	}
	else if (placeInfo.desc)
	{
   		WTDebugPush(justContents ? "justContents" : "desc")
		if (! justContents)
		{
			WTAddChunk(placeInfo.desc, arOut)
		}
        WTListVisibleObjects(placeInfo, arOut)
		WTDebugPop()
	}
    else if (placeInfo.descFunc)
    {
   		WTDebugPush("descFunc")
        placeInfo.descFunc(arOut, id)
		WTDebugPop()
    }
    else
    {
   		WTError("Item '" + id + "' has no first, desc or descFunc")
        WTAddChunk("It's just a normal looking {" + id + "}.", arOut)
    }
}

function WTListVisibleObjects(objData, arOut)
{
	WTDebugPush("things")
    var showNothingText = 'nothing' in objData

	if (!s_wtOptions.NOTHINGS)
	{
		if ('things' in objData)
		{
			var things = objData.things

			for (objName in things)
			{
				if (s_wtCarriedThings[objName])
				{
					WTError("Object '" + objName + "' is both in current location and inventory")
				}
			
				WTAddChunk(things[objName], arOut)
				showNothingText = false
			}
		}
		
		if ('contents' in objData && objData.contentsPrefix)
		{
			let contents = WTBuildStringForContents(objData.contents)
			if (contents)
			{
				if (objData.contentsPrefixPlural && Object.keys(objData.contents).length > 1)
				{
					WTAddChunk(objData.contentsPrefixPlural + " " + contents + ".", arOut)
				}
				else
				{
					WTAddChunk(objData.contentsPrefix + " " + contents + ".", arOut)
				}
				showNothingText = false
			}
		}
	}

    if (showNothingText)
    {
        WTAddChunk(objData.nothing, arOut)
    }
	WTDebugPop()
}

function WTMakeLink(match, text)
{
//	WTDebug("WTMakeLink('" + match + "', '" + text + "')")

	const splitIt = text.split(':')
	const func = (splitIt.length > 1) ? splitIt[0] : "WTClick"
	const instruction = splitIt[splitIt.length - 1]
	const instBits = instruction.split('@')
	const p1 = instBits[0]
    const objInfo = kObjects[p1]

    if (objInfo)
    {
    	let realObjId = objInfo.alias ? objInfo.alias : p1
    	let params = "'" + realObjId + "'"

    	if (instBits.length > 1)
    	{
    		params += ", '" + instBits[1] + "'"
    	}
    	
    	let call = func + "(" + params + ")"
    	let col = s_wtSettings.colourDefault

    	if ("travel" in kObjects[realObjId])
    	{
    		if (s_prefs.room.on)
    		{
	    		col = s_wtSettings.colourRoom
	    	}
    	}
    	else if (realObjId in s_wtCarriedThings)
    	{
    		let showUsable = false
    		
    		if (s_prefs.combine.on)
    		{
    			if ("combine" in kObjects[realObjId] && s_wtClickedObject in kObjects[realObjId].combine)
	    		{
	    			showUsable = true
	    		}
	    		else if (kObjects[realObjId].usableCheck)
	    		{
	    			showUsable = kObjects[realObjId].usableCheck()
	    		}
	    	}
	    	
	    	if (showUsable)
	    	{
    			col = s_wtSettings.colourCombine
    		}	
    		else if (s_prefs.held.on)
    		{
	    		col = s_wtSettings.colourHeld
    		}
    	}
    	let open = 'span onclick="' + call + '" style="cursor: pointer; text-decoration:' + (s_prefs.u.on ? "underline" : "none") + '"'
    	g_linksOnScreen[realObjId] = 1
    	if (kObjects[realObjId].clicked || !s_prefs.b.on)
    	{
	        open += '|' + s_wtSettings.linkStartVisited
	    }
	    else
	    {
	        open += '|' + s_wtSettings.linkStart
	    }
        return WTTag(open + "|font color=\"" + col + "\"", objInfo.name ? objInfo.name : p1)
    }
    return WTTag("font color=red", p1)
}

function WTPrepareText(text)
{
	WTDebugCheckText(text)

	s_lastTextPrepared = s_fakeLastTextPrepared ? s_fakeLastTextPrepared : text
	s_fakeLastTextPrepared = null

	return text.replace(/ *#$/, '').replace(/ *# */g, s_paragraphBreak).replace(/{([^{]*)}/g, WTMakeLink)	
}

let s_randomCounter = 1000
let s_wanderDelay = 200

function WTRandomClick()
{
	-- s_randomCounter
	if (s_randomCounter == 0)
	{
		s_randomCounter = 1000
		return
	}
	
	let keys = Object.keys(g_linksOnScreen)
	let len = keys.length
	
	if (len)
	{
		let bestScore
		let bestLink = null

		for (let a = 0; a < len; ++ a)
		{
			let picked = Math.floor(Math.random() * len)
			let thisLink = keys[picked]

			let timesClicked = s_timesClicked[s_wtPrevObject + ":" + thisLink]
			if (! timesClicked)
			{
				timesClicked = 0
			}
			else if (WTInventoryContains(thisLink))
			{
				timesClicked *= 10
			}

			if (! bestLink || timesClicked < bestScore)
			{
				bestScore = timesClicked
				bestLink = thisLink
			}
		}

		if (bestLink)
		{
			WTAutomatedClick(bestLink)
			return
		}
	}
	
	WTDebug("RANDOM WANDER: Failed to find best link from [" + keys + "] (" + len + ")")
}

function WTShowText(prepared)
{
	document.getElementById('TEXTAREA').innerHTML = prepared

	if (s_randomWander)
	{
		s_wanderDelay -= 5

		if (s_wanderDelay <= 0)
		{
			s_wanderDelay = 0
		}

		setTimeout(WTRandomClick, s_wanderDelay)
	}
}

function WTEndGame()
{
	WTDebugPush("EndGame")
	WTSetAlignment("center")
	
	let showThis = new Array()
	let completeString = "You completed <B>" + s_wtSettings.gameName + "</B> in " + s_history.length + " steps."
	
	const timeString = WTTimerGetAsString()
	if (timeString)
	{
		completeString += " You took " + timeString + "."
	}

	showThis.push(completeString)
	showThis.push("Got 2 spare minutes? Please complete this {WTOpenURL:survey}!")
	showThis.push("{WTRestart:restart}")
	showThis.push("{WTShare:share}")
    WTShowText(WTPrepareText(showThis.join("#")))
	WTDebugPop()
}

function WTRestart()
{
	if (confirm("Are you sure you want to restart?"))
	{
		let arr = window.location.href.split('?')
		window.location.href = arr[0]
	}
}

function WTShare()
{
	alert("There's no clever sharing mechanism here yet - sorry! In the meantime how about copying the URL and pasting it on social media or into an email? Thank you!")
}

function WTOpenURL(param)
{
	window.open(kStrings["url_" + param]);
}