function OnlyKeepValid(arr)
{
	var reply = []

	for (var a of arr)
	{
		if (a)
		{
			reply.push(a)
		}
	}
	
	return reply
}

function SetUpHyphenCheck(w)
{
	const [w1, w2] = w.split('-')
	document.getElementById("hyphenCheckFirst").value = w1
	document.getElementById("hyphenCheckSecond").value = w2
	HyphenCheck()
}

function HyphenCheck()
{
	const firstWord = OnlyKeepValid(document.getElementById("hyphenCheckFirst").value.split(/[^'a-z\-0-9\&]+/))
	const secondWord = OnlyKeepValid(document.getElementById("hyphenCheckSecond").value.split(/[^'a-z\-0-9\&]+/))

	var scores = {}
	
	if (firstWord.length && secondWord.length)
	{
		var singleWords = []

		for (var w1 of firstWord)
		{
			for (var w2 of secondWord)
			{
				singleWords.push(w1 + "-" + w2)
				singleWords.push(w1 + w2)
			}
		}

		for (s of g_sentences)
		{
			var justSawFirstWord = null

			for (var w of s.listOfWords)
			{
				if (singleWords.includes(w))
				{
					scores[w] = (scores[w] ?? 0) + 1
				}
				else if (justSawFirstWord && secondWord.includes(w))
				{
					const both = justSawFirstWord + " " + w
					scores[both] = (scores[both] ?? 0) + 1
//						console.log("Found '" + both + "' in '" + s + "'")
				}

				justSawFirstWord = firstWord.includes(w) ? w : null
			}
		}
	}
	else
	{
		for (s of g_sentences)
		{
			for (var w of s.listOfWords)
			{
				if (w.includes('-'))
				{
					scores[w] = (scores[w] ?? 0) + 1
				}
			}
		}
	}

	var output = []
	TableOpen(output)
	TableAddHeading(output, "Text")
	TableAddHeading(output, "Count")
	for (var txt of Object.keys(scores).sort((p1, p2) => (scores[p2] - scores[p1])))
	{
		const score = scores[txt]
		if (txt.split('-').length == 2)
		{
			txt = '<B ONCLICK="SetUpHyphenCheck(\'' + txt + '\')">' + txt + '</B>'
		}
		TableNewRow(output)
		output.push("<TD>" + txt + "<TD align=center>" + score)
	}
	output.push("</TABLE>")
	document.getElementById("hyphenCheckOutput").innerHTML = output.join("")
}

function HyphenClear()
{
	document.getElementById("hyphenCheckFirst").value = ""
	document.getElementById("hyphenCheckSecond").value = ""
	HyphenCheck()
}

g_tabFunctions.hyphen_check = function(reply, thenCall)
{
	reply.push("<TABLE CELLPADDING=0 CELLSPACING=0>")
	var after = '<TD ROWSPAN=2>&nbsp;<BUTTON tabindex="-1" ONCLICK="HyphenClear()">Clear</BUTTON>'
	for (var example of g_tweakableSettings.hyphenCheckPairs ?? [])
	{
		var [w1, w2] = example.split('-')
		after += ' <A tabindex="-1" HREF="javascript:SetUpHyphenCheck(\'' + example + '\')">' + w1.split(' ')[0] + w2.split(' ')[0] + '</A>'
	}
	for (var a of ["First", "Second"])
	{
		reply.push("<TR><TD>" + a + " word(s):&nbsp;<TD><INPUT TYPE=text ID=hyphenCheck" + a + ' onChange="HyphenCheck()">' + after)
		after = ''
	}
	reply.push("</TABLE><P ID=hyphenCheckOutput></P>")
	thenCall.push(HyphenCheck)
}
