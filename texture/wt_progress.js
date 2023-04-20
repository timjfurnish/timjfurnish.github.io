let g_progress = new Object()
let g_myProg = new Object()
let g_extraHintFunc = null
let s_progressNeedsSaving = false

function WTSetExtraHintFunc(func)
{
	g_extraHintFunc = func
}

function wt_addProgress(category, stateName, hintText)
{
	let c = g_progress[category]
	let size = 0
	
	if (c)
	{
		size = c.numStates ++
	}
	else
	{
		c = new Object()
		g_progress[category] = c
		c.numStates = 1
	}
	
	let o = new Object()
	c[stateName] = o
	o.value = size
//	o.stateName = stateName
	if (hintText)
	{
		o.hintText = hintText
	}
	
//	WTDebug("Adding progress category '" + category + "' state " + size + ": (" + stateName + ') = "' + hintText + '"')
}

function wt_progressCompleted(category)
{
	let info = g_progress[category]
	
	if (! info)
	{
		WTError("No progress category '" + category + "' (wanted to check it's completed)")
		return false
	}

	let myProg = g_myProg[category]
	if (myProg)
	{
		WTDebug("Progress with category '" + category + "' is " + myProg.value + "/" + (info.numStates - 1))
		return myProg.value >= info.numStates - 1
	}
	
	WTDebug("Player has made no progress with category '" + category + "'")
	return false
}

function wt_progressReached(category, v)
{
	let info = g_progress[category]
	
	if (! info)
	{
		WTError("No progress category '" + category + "' (wanted to check it's started)")
		return false
	}

	let myProg = g_myProg[category]
	if (myProg)
	{
		WTDebug("Progress with category '" + category + "' is " + myProg.value + "/" + (info.numStates - 1))
		return myProg.value >= v
	}
	
	WTDebug("Player has made no progress with category '" + category + "'")
	return false
}

function wt_setProgress(category, stateName)
{
	let info = g_progress[category]
	
	if (! info)
	{
		WTError("No progress category '" + category + "' (wanted to set it to '" + stateName + "')")
		return
	}

	let newStateInfo = info[stateName]

	if (! newStateInfo)
	{
		WTError("Progress category '" + category + "' has no state called '" + stateName + "'")
		return
	}

	let oldStateInfo = g_myProg[category]

	if (oldStateInfo)
	{
		if (newStateInfo.value <= oldStateInfo.value)
		{
//			WTDebug("Not changing state of '" + category + "' to '" + stateName + "' (" + newStateInfo.value + ") as we've got to value " + oldStateInfo.value + " already")
			return
		}
	}
	
	WTDebug("Changing state of '" + category + "' to '" + stateName + "' (" + newStateInfo.value + ') hint="' + newStateInfo.hintText + '"')
	g_myProg[category] = newStateInfo
	s_progressNeedsSaving = true
}

function WTSaveProgressIfRequired()
{
	if (s_progressNeedsSaving)
	{
		WTStorage_WriteValue('progress', wt_getScore() + "/" + wt_getTotalPossibleScore())
		s_progressNeedsSaving = false
	}
}

function wt_getScore()
{
	let total = 0
	const values = Object.values(g_myProg)
	for (const value of values)
	{
		total += value.value
	}
	return total
}

function wt_getTotalPossibleScore()
{
	let total = 0
	const values = Object.values(g_progress)
	for (const value of values)
	{
		total += value.numStates - 1
	}
	return total
}

function TabHints()
{
	let hints = new Array()
	const values = Object.values(g_myProg)
	for (const value of values)
	{
		let hintText = value.hintText
		if (hintText)
		{
			hints.push(hintText)
		}
	}
	
	if (g_extraHintFunc)
	{
		g_extraHintFunc(hints)
	}
	
	return "<SMALL>" + hints.join("<FONT SIZE=1><BR>&nbsp;<BR></FONT>") + "</SMALL>"
}

function TabStats()
{
	let out = new Array()

	out.push("Progress: <B>" + wt_getScore() + "</B>/<B>" + wt_getTotalPossibleScore() + "</B>")

	out.push("Steps: <B>" + s_history.length + "</B>")

	const timeString = WTTimerGetAsString()
	if (timeString)
	{
		out.push("Time: <B>" + timeString + "</B>")
	}
	
	return out.join('<P>')
}

function WTEnableProgressTabs()
{
	WTAddPanelTab("HINTS", TabHints)
	WTAddPanelTab("STATS", TabStats)
	WTSelectTab("HINTS")
}