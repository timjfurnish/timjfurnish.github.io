let s_dbg = false
let s_wtDebugInfo = new Array()

const s_maxTextLength = 850
 
function WTEnableDebugging()
{
	WTAddPanelTab("DBG: STATES", TabDebugStates)
	WTAddPanelTab("DBG: RAW TEXT", TabDebugRaw)
	WTAddPanelTab("DBG: HISTORY", TabDebugHistory)
	s_dbg = true
}

function WTDebugPush(info)
{
	s_wtDebugInfo.push(info)
}

function WTDebugPop()
{
	s_wtDebugInfo.pop()
}

function TabDebugStates()
{
	let prog = new Array()
	const keys = Object.keys(g_progress)
	for (const k of keys)
	{
		let p = g_progress[k]
		let m = g_myProg[k]
		prog.push(k + "=" + (m ? m.value : "unstarted") + "/" + (p.numStates - 1))
	}

	return "<SMALL><SMALL>PROGRESS:<BR>" + prog.join(', ') + "<P>RECENT CHANGES:<BR>" + s_wtDebug.join('<BR>') + "<P>HERE:<BR>" + Object.keys(g_linksOnScreen) + '<P></SMALL></SMALL>AUTOPILOT LINK:<BR><A HREF="index.html?debug&auto=' + s_history.join(',') + '">Copy this</A>'
}

function TabDebugHistory()
{
	return "<SMALL><SMALL>" + s_history.join(', ') + "</SMALL></SMALL>"
}

function TabDebugRaw()
{
	const text = s_lastTextPrepared.replace(/ *#$/, '')
	return '<SMALL><SMALL>' + text + '<BR><BR></SMALL></SMALL>Length=' + text.length
}

function WTDebugGetContextString()
{
	if (s_wtDebugInfo.length)
	{
		return "[" + s_wtDebugInfo.join('; ') + "] "
	}

	return ""
}

function WTDebug(txt)
{
	if (s_dbg)
	{
		txt = WTDebugGetContextString() + txt
		s_wtDebug.push(txt)
		console.log(txt)
	}
}

function WTError(txt)
{
	if (s_dbg)
	{
		txt = "ERROR: " + WTDebugGetContextString() + txt
		alert(txt)
		console.log(txt)
		s_randomWander = false
	}
}

function WTDebugCheckText(text)
{
	if (s_dbg)
	{
		text = text.replace(/ *#$/, '')

		let len = text.length
		let errors = new Array()
	
		if (len > s_maxTextLength)
		{
			errors.push("Text is too long! Length is " + len + ", max length is " + s_maxTextLength + ".")
		}
		
		let bits = text.split('#')
		
		if (bits.length > 5)
		{
			errors.push("Text contains " + bits.length + " paragraphs, that's a lot!")
		}
		
		if (text.includes('<P>') || text.includes('<p>'))
		{
			errors.push("Text contains '<p>' but should use '#'!")
		}
	
		if (errors.length)
		{
			WTError(errors.join('\n') + '\n\n' + text)
		}
	}
}