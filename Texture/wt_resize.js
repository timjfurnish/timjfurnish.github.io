var s_fontSizeOffset = 0
var s_baseFontSize = pickBestSize()
var s_lastFontSizeSet = 0
var s_resizeElements = new Array("PANELTABS", "GAMEHERE", "TITLE", "SMALLER", "BIGGER", "OPTIONSLINK", "OPTIONSCONTENTS", "CLOSEPANEL")

function pickBestSize()
{
	return 1 + Math.floor((window.innerHeight * window.innerWidth) * 0.00003)
}

function WTInitFontSize()
{
	let offset = WTStorage_GetValue('fontSizeOffset')
	if (offset)
	{
		s_fontSizeOffset = parseInt(offset)
	}
	WTApplyFontSize()
}

function redoSize()
{
	s_baseFontSize = pickBestSize()
	WTApplyFontSize()
}

function WTApplyFontSize()
{
	let applySize = s_fontSizeOffset + s_baseFontSize
	
	if (applySize < 1)
	{
		applySize = 1
	}
	else if (applySize > 100)
	{
		applySize = 100
	}

	if (applySize != s_lastFontSizeSet)
	{
		for (name of s_resizeElements)
		{
			let elem = document.getElementById(name)
			
			if (elem)
			{
				elem.style.fontSize = applySize;
			}
			else
			{
				WTDebug("No element called '" + name + "'")
			}
		}
	}
}

function smaller()
{
	if (s_fontSizeOffset + s_baseFontSize > 1)
	{
		-- s_fontSizeOffset
		WTApplyFontSize()
		WTStorage_WriteValue('fontSizeOffset', s_fontSizeOffset)
	}
}

function bigger()
{
	if (s_fontSizeOffset + s_baseFontSize < 100)
	{
		++ s_fontSizeOffset
		WTApplyFontSize()
		WTStorage_WriteValue('fontSizeOffset', s_fontSizeOffset)
	}
}