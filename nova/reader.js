//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_readSentenceNum = 0
var g_voiceLookUp = {}
var g_voiceLanguages = []

function SpeakUsingVoice(thingToSay, voiceType, onEnd)
{
	var speaky = new SpeechSynthesisUtterance(thingToSay)

	console.log("[" + voiceType + "] " + thingToSay)

	if (onEnd)
	{
		speaky.onend = onEnd
	}

	speaky.voice = g_voiceLookUp[g_tweakableSettings[voiceType]]
	speechSynthesis.cancel()
	speechSynthesis.speak(speaky)
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
		NovaLog("Of " + voices.length + " total voices, " + Object.keys(g_voiceLookUp).length + " '" + wantLang + "' voices added to look-up table (" + g_voiceLanguages.length + " languages)")
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
