var g_readSentenceNum = 0

function Read()
{
	const thingToSay = g_sentences[g_readSentenceNum]
	if (thingToSay)
	{
		var speaky = new SpeechSynthesisUtterance(thingToSay.text.replace('^', ''))
		speaky.onend = OnDoneSpeaking
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