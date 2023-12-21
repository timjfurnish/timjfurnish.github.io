var g_readSentenceNum = 0
var g_voiceLookUp = {}
var g_voiceLanguages = []

function Read()
{
	const thingToSay = g_sentences[g_readSentenceNum]
	if (thingToSay)
	{
		var speaky = new SpeechSynthesisUtterance(thingToSay.text.replace('^', ''))
		speaky.onend = OnDoneSpeaking
		speaky.voice = g_voiceLookUp[thingToSay.heading ? g_tweakableSettings.voiceHeading : g_tweakableSettings.voiceDefault]
		speechSynthesis.speak(speaky)
	}
}

function OnDoneSpeaking()
{
	if (document.getElementById('keepTalking')?.checked)
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
				var text = sentence.text.replace('^', '')
				if (i == g_readSentenceNum)
				{
					text = '<B>' + text + '</B>'
				}
				else
				{
					text = '<SMALL>' + text + '</SMALL>'
				}
				
				if (sentence.heading)
				{
					text = '<BIG><U>' + text + '</U></BIG>'
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
			reply.push('<option value=' + headingInfo.startsAt + '>' + headingInfo.txt + ' (' + headingInfo.numPara + ' paragraphs, ' + headingInfo.numSentences + ' sentences)</option>')
		}
		
		reply.push('</select><BR><BR>')
	}
	reply.push('<BUTTON ONCLICK="Read()">Read next sentence</BUTTON> &nbsp; ')
	reply.push('<button onclick="ResetWhatToRead(g_readSentenceNum - 1)" id="sentenceBack">&lt;</button>')
	reply.push('<input type="text" id="sentenceNum" readonly>')
	reply.push('<button onclick="ResetWhatToRead(g_readSentenceNum + 1)" id="sentenceFwd">&gt;</button> &nbsp; ')	
	reply.push('<INPUT TYPE="checkbox" id="keepTalking"><LABEL FOR="keepTalking"> Keep talking</LABEL><BR><BR>')
	reply.push("<div id=whatToRead></div>")
	
	thenCall.push(RedrawNextThingToRead)
	thenCall.push(SetSentenceNum)
}

function ReadVoices()
{
	try
	{
		const voices = window.speechSynthesis.getVoices()
		console.log("Voices have changed! Now got " + voices.length)
		g_voiceLookUp = {}
		var languages = {}
		const wantLang = g_tweakableSettings.language
		for (var voice of voices)
		{
			languages[voice.lang] = true
			if (voice.lang == wantLang)
			{
				g_voiceLookUp[voice.name] = voice
			}
		}
		g_voiceLanguages = Object.keys(languages)
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
	ReadVoices()
}
catch (error)
{
	ShowError("While setting available voices callback:\n\n" + error.stack)
}
