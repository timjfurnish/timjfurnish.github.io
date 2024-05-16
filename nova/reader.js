//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_readSentenceNum = 0
var g_voiceLookUp = {}
var g_voiceLanguages = []
var g_currentSpeaky

function OnReaderError()
{
	NovaLog("SPEECH", "error")
}

function OnReaderPause()
{
	NovaLog("SPEECH", "pause")
}

function OnReaderBoundary()
{
	NovaLog("SPEECH", "boundary")
}

function SpeakUsingVoice(thingToSay, voiceType, onEnd)
{
	g_currentSpeaky = new SpeechSynthesisUtterance(thingToSay)

	NovaLog("SPEECH", "[" + voiceType + "] " + thingToSay)

	if (onEnd)
	{
		g_currentSpeaky.onend = onEnd
	}

	g_currentSpeaky.onerror = OnReaderError
	g_currentSpeaky.onboundary = OnReaderBoundary
	g_currentSpeaky.onpause = OnReaderPause
	g_currentSpeaky.voice = g_voiceLookUp[g_tweakableSettings[voiceType]]
	speechSynthesis.cancel()
	speechSynthesis.speak(g_currentSpeaky)
}

function ReadVoices()
{
	try
	{
		const voices = window.speechSynthesis.getVoices()
		g_voiceLookUp = {}
		var languages = {}
		const wantLang = g_tweakableSettings.language
		for (var voice of voices)
		{
			const [lang, region] = voice.lang.toUpperCase().split("-")
			
			languages[lang] = true
			if (lang == wantLang)
			{
				var storeAs = voice.name.replace("(United Kingdom)", "(UK)")

				if (region)
				{
					storeAs = region + " - " + storeAs
				}

				g_voiceLookUp[storeAs] = voice
			}
		}
		g_voiceLanguages = Object.keys(languages).sort()
		NovaLog("VOICE", "Of " + voices.length + " total voices, " + Object.keys(g_voiceLookUp).length + " '" + wantLang + "' voices added to look-up table (" + g_voiceLanguages.length + " languages)")
	}
	catch (error)
	{
		ShowError("While handling change in available voices:\n\n" + error.stack)
	}
}

try
{
	window.speechSynthesis.onvoiceschanged = ReadVoices
}
catch (error)
{
	ShowError("While setting available voices callback:\n\n" + error.stack)
}
