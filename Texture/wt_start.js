let s_autopilot = null

//-------------------------------------
// WTStartGame - call from game code
//-------------------------------------

function WTStartGame()
{
	WTDebugPush("StartGame")
	WTInitFontSize()

	kStrings.true = true

	let urlBits = window.location.href.split('?')
	let progressTxt = null
	let skipFirstScreen = false
	
	if (urlBits.length > 1)
	{
		let pairs = urlBits[1].split('&')

		for (const p of pairs)
		{
			let keyVal = p.split('=')
			let key = keyVal[0].toLowerCase()

			WTDebug("Command line param '" + p + "'")

			if (key == 'debug')
			{
				WTEnableDebugging()
			}
			else if (key == 'go')
			{
				skipFirstScreen = true
			}
			else if (key == 'wander')
			{
				skipFirstScreen = true
				s_randomWander = true
			}
			else if (key == 'auto')
			{
				if (keyVal.length >= 2)
				{
					s_autopilot = keyVal[1] ? keyVal[1].split(',') : new Array()
					WTDebug("AUTOPILOT SIZE: " + s_autopilot.length)
				}
			}
			else
			{
				WTDebug("Unhandled parameter: '" + p + "'")
			}
		}
	}

	WTInitOptions()
	WTInitCommands()
	
	if (s_autopilot == null)
	{
		s_autopilot = WTStorage_ReadHistory()
		progressTxt = WTStorage_GetValue('progress')
	}
	
	WTSelectTab(s_wtSettings.initialTab)
	
	s_wtCurLoc = s_wtSettings.initialRoom

	if (skipFirstScreen)
	{
		WTBeginGame(s_autopilot ? 'continuegame' : 'letsgo')
	}
	else
	{
		let showThis = new Array()
		if (s_autopilot && s_autopilot.length)
		{
			let info = s_autopilot.length + ((s_autopilot.length == 1) ? " step" : " steps")
			if (progressTxt)
			{
				info += ", progress " + progressTxt
			}
			showThis.push(s_wtSettings.welcomeBack)
			showThis.push("{WTBeginGame:continuegame}<br>(" + info + ")")
			showThis.push("{WTPickDifficulty:newgame}")
		}
		else
		{
			showThis.push(s_wtSettings.welcome)
			showThis.push(s_wtSettings.introText)
			showThis.push("{WTPickDifficulty:begin}")
		}
		showThis.push(s_wtSettings.introHelpPrompt)
		WTShowText(WTPrepareText(showThis.join("#")))
	}
	
	WTDebugPop()
}

function WTPickDifficulty()
{
    WTShowText(WTPrepareText("<B>Before you begin...</B>#Check out the {WTShowPanel:OPTIONS} and select how much help you want on your adventure.#Then {WTBeginGame:letsgo}!"))
}

function WTBeginGame(param)
{
	WTDebugPush("BeginGame:" + param)

	WTSetAlignment(s_wtSettings.align)

	let initialPage = new Array()
	WTAddChunk(s_wtSettings.initialText, initialPage)
    let formatted = WTPrepareText(initialPage.join(' '))

	if (param == "continuegame" && s_autopilot && s_autopilot.length)
	{
	    for (instruction of s_autopilot)
   		{
   			let bits = instruction.split('@')
    		let f = WTFollowLink(bits[0], bits[1])

	    	if (f != null)
    		{
    			WTPrepareText(s_lastTextPrepared)
    			formatted = f
    		}
    	}

		WTTimerLoad()
	}
	else
	{
		WTTimerStart(0)
	}
    
    s_autopilot = null
    WTShowText(formatted)
    
    WTEnableProgressTabs()
    WTDebugPop()
}