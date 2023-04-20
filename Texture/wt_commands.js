var s_wtCmdList = new Object()

function WTCmdSTATE(param)
{
	var bits = param.split('=')
	if (bits.length == 2)
	{
		wt_setProgress(bits[0], bits[1])
	}
}

function WTCmdSETLASTPROCESSED(param)
{
	s_fakeLastTextPrepared = kStrings[param]
	WTDebugCheckText(s_fakeLastTextPrepared)
}

function WTCmdNAME(param)
{
	const objInfo = kObjects[param]
	return (objInfo && objInfo.name) ? objInfo.name : param
}

function WTCmdLINK(param)
{
	const obj = kObjects[param]
	const seen = obj && obj.clicked
	const prefix = seen ? "the" : "a"
	return prefix + " {" + param + "}"
}

function WTCmdREPLACELOCATION(param)
{
	const low = param.includes('low')
	const own = param.includes('own')
	const is = param.includes('is')

	if (s_wtOptions.LOCATIONMENTIONED)
	{
		return (low ? "it" : "It") + (own ? "s" : (is ? "'s" : ""))
	}

	const objInfo = kObjects[s_wtCurLoc]
	const name = (objInfo && objInfo.name) ? objInfo.name : s_wtCurLoc
	return (low ? "the " : "The ") + name + (own ? "'s" : (is ? " is" : ""))
}

function WTSetObjMember(here, str)
{
	var path = here.split('.')
	var object = kObjects
	var i = 0

	while (i < path.length - 1)
	{
		if (path[i] in object)
		{
			object = object[path[i]]
		}
		else
		{
			let o = new Object()
			object[path[i]] = o
			object = o
			WTDebug("While setting '" + here + "' created new object at depth " + i + " called '" + path[i] + "'")
		}
		++ i
	}

	WTDebug("Setting '" + here + "' to '" + str + "' (was previously '" + object[path[i]] + "')")
	object[path[i]] = str
}

function WTCmdLISTCONTENTS(param)
{
	var bits = param.split('=')
	if (bits.length == 2)
	{
		let txt = WTBuildStringForContents(kObjects[bits[0]].contents)

		if (txt)
		{
			return kStrings[bits[1]] + txt
		}
	}
	
	return ""
}

function WTCmdSET(param)
{
	var bits = param.split('=')
	if (bits.length == 2)
	{
		let txt = bits[1]
		
		if (txt[0] == '&')
		{
			WTSetObjMember(bits[0], txt.substring(1))
		}
		else if (txt in kStrings)
		{
			WTSetObjMember(bits[0], kStrings[txt])
		}
		else
		{
			WTError("Can't set '" + bits[0] + "' to invalid string ID '" + txt + "'")
		}
	}
	else
	{
		WTError("Bad params '" + param + "'")
	}
}

function WTCmdDELETE(param)
{
	var here = param
	var path = here.split('.')
	var object = kObjects
	var i = 0
	while (i < path.length - 1)
	{
		if (path[i] in object)
		{
			object = object[path[i]]
			++ i
		}
		else
		{
			WTError("Invalid path '" + here + "' - failed to find '" + path[i] + "'")
			return
		}
	}
	
	WTDebug("Deleting '" + param + "'")
	delete object[path[i]]
}

function WTInitCommands()
{
	WTDebug("WTInitCommands")
	s_wtCmdList.NAME = WTCmdNAME
	s_wtCmdList.SET = WTCmdSET
	s_wtCmdList.DELETE = WTCmdDELETE
	s_wtCmdList.LINK = WTCmdLINK
	s_wtCmdList.COLLECT = WTAddToInventory
	s_wtCmdList.LOCATION = WTSetLocation
	s_wtCmdList.LOSE = WTRemoveFromInventory
	s_wtCmdList.STATE = WTCmdSTATE
	s_wtCmdList.SETLASTPROCESSED = WTCmdSETLASTPROCESSED
	s_wtCmdList.REPLACELOCATION = WTCmdREPLACELOCATION
	s_wtCmdList.LISTCONTENTS = WTCmdLISTCONTENTS
}