//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_readSentenceNum = 0
var g_voiceLookUp = {}
var g_voiceLanguages = []
var g_currentSpeaky

const SpeechTest     = whichOne  => SpeakUsingVoice("Testing, one two three!", whichOne)

function OnReaderStart(e)
{
	TrySetElementContents("saying", "Saying &quot;<b>" + e.utterance.text + "</b>&quot; (started)")
}

function OnReaderEnd(e)
{
	if (g_currentSpeaky)
	{
		g_currentSpeaky = undefined
		TrySetElementContents("saying", "")
		e?.target?.myNovaOnEndCallback?.()
	}
}

function StopTalking()
{
	if (g_currentSpeaky)
	{
		g_currentSpeaky = undefined
		TrySetElementContents("saying", "")
		speechSynthesis.cancel()
	}
}

// const OnReaderLogEvent = e => console.log(e)

function SpeakUsingVoice(thingToSay, voiceType, onEnd)
{
	StopTalking()

	g_currentSpeaky = new SpeechSynthesisUtterance(thingToSay)

	if (onEnd)
	{
		g_currentSpeaky.myNovaOnEndCallback = onEnd
	}

	g_currentSpeaky.addEventListener("start", OnReaderStart)
	g_currentSpeaky.addEventListener("end", OnReaderEnd)
	g_currentSpeaky.rate = g_tweakableSettings.speakRate
	g_currentSpeaky.voice = g_voiceLookUp[g_tweakableSettings[voiceType]]
	speechSynthesis.speak(g_currentSpeaky)
	
	TrySetElementContents("saying", "Saying &quot;<b>" + thingToSay + "</b>&quot; (requested)")
}

function ReadVoices()
{
	try
	{
		const voices = window.speechSynthesis.getVoices()
		g_voiceLookUp = {Default:null}
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
				if (! voice.localService)
				{
					storeAs += " [REMOTE]"
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
