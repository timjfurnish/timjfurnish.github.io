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

	if (onEnd)
	{
		speaky.onend = onEnd
	}

	speaky.voice = g_voiceLookUp[g_tweakableSettings[voiceType]]
	speechSynthesis.speak(speaky)
}

function Read()
{
	const thingToSay = g_sentences[g_readSentenceNum]
	if (thingToSay)
	{
		SpeakUsingVoice(thingToSay.text, thingToSay.isSpeech ? "voiceSpeech" : thingToSay.heading ? "voiceHeading" : "voiceDefault", OnDoneSpeaking)
	}
}

function OnDoneSpeaking()
{
	if (document.getElementById('voice.keepTalking')?.checked)
	{
		ResetWhatToRead(g_readSentenceNum + 1)
		Read()
	}
}

function SetSentenceNum(num)
{
	if (num !== undefined)
	{
		g_readSentenceNum = num
	}

	var showHere = document.getElementById('sentenceNum')
	if (showHere)
	{
		showHere.value = g_sentences ? "Sentence " + (g_readSentenceNum + 1) + "/" + g_sentences.length : ""
	}
	RedrawNextThingToRead()
}

function ResetWhatToRead(num)
{
	SetSentenceNum(num)
	var chapterSelect = document.getElementById('chapter')
	if (chapterSelect)
	{
		var bestHeading = 0

		for (var h of g_headingToSentence)
		{
			if (num >= h.startsAt)
			{
				bestHeading = h.startsAt
			}
		}
		
		chapterSelect.value = bestHeading
	}
}

function RedrawNextThingToRead()
{
	var whatToRead = document.getElementById("whatToRead")
	if (whatToRead && g_sentences)
	{
		var output = []
		for (var i = g_readSentenceNum - 2; i <= g_readSentenceNum + 2; ++ i)
		{
			const sentence = g_sentences[i]
			if (sentence)
			{
				var text = sentence.text
				if (i == g_readSentenceNum)
				{
					text = '<B>' + text + '</B>'
				}
				else
				{
					text = '<SMALL>' + text + '</SMALL>'
				}
				
				if (sentence.isSpeech)
				{
					text = '<I>' + text + '</I>'
				}
				else if (sentence.heading)
				{
					text = '<BIG><U>' + text + '</U></BIG>'
				}
				
				if (sentence.hasIssues)
				{
					text = '<FONT COLOR=red>' + text + '</FONT>'
				}
				
				output.push(text)
			}
		}
		whatToRead.innerHTML = output.join('<BR>')
	}
}

function SelectedChapter()
{
	SetSentenceNum(parseInt(document.getElementById('chapter').value))
}

g_tabFunctions.voice = function(reply, thenCall)
{
	if (g_headingToSentence && g_headingToSentence.length)
	{
		reply.push('Chapter: <select id="chapter" onChange="SelectedChapter()"></nobr>')
			
		for (var headingInfo of g_headingToSentence)
		{
			reply.push('<option value=' + headingInfo.startsAt + '>' + headingInfo.txt + '</option>')
		}
		
		reply.push('</select><BR><BR>')
	}
	reply.push('<BUTTON ONCLICK="Read()">Read next sentence</BUTTON> &nbsp; ')
	reply.push('<button onclick="ResetWhatToRead(g_readSentenceNum - 1)" id="sentenceBack">&lt;</button>')
	reply.push('<input type="text" id="sentenceNum" readonly>')
	reply.push('<button onclick="ResetWhatToRead(g_readSentenceNum + 1)" id="sentenceFwd">&gt;</button> &nbsp; ')
	OptionsMakeCheckbox(reply, null, "keepTalking", "Keep talking")
	reply.push("<p id=whatToRead></p>")
	
	thenCall.push(RedrawNextThingToRead)
	thenCall.push(SetSentenceNum)
}

function ReadVoices()
{
	try
	{
		const voices = window.speechSynthesis.getVoices()
//		console.log("Voices have changed! Now got " + voices.length)
		g_voiceLookUp = {}
		var languages = {}
		const wantLang = g_tweakableSettings.language
		for (var voice of voices)
		{
			const [lang, region] = voice.lang.toUpperCase().split("-")
			
			languages[lang] = true
			if (lang == wantLang)
			{
				const storeAs = region ? region + " - " + voice.name : voice.name
				g_voiceLookUp[storeAs] = voice
			}
		}
		g_voiceLanguages = Object.keys(languages).sort()
		console.log(Object.keys(g_voiceLookUp).length + " voices in language '" + wantLang + "' added to look-up table; " + g_voiceLanguages.length + " languages")
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
