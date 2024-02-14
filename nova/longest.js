//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_longest = {wordCount:{}, wordScore:{}, paraSentences:{txt:"Paragraph with most sentences"}, paraWords:{txt:"Paragraph with most words"}, paraChr:{txt:"Paragraph with most characters"}, sentence:{txt:"Sentence with most words"}, sentenceChr:{txt:"Sentence with most characters"}}

OnEvent("clear", () =>
{
	for (var resetLongest of Object.values(g_longest))
	{
		resetLongest.num = 0
		resetLongest.what = null
	}
})

function CheckIfLongest(thing, num, what)
{
	if (g_longest[thing].num < num)
	{
		g_longest[thing].what = what
		g_longest[thing].num = num
	}
}

/*
g_tabFunctions.longest = function(reply, thenCall)
{
	var before = ""
	for (var longData of Object.values(g_longest))
	{
		if (longData.what && longData.txt)
		{
			reply.push(before + "<B>" + longData.txt + ":</B><BR><BR>")
			reply.push(Array.isArray(longData.what) ? longData.what.join('<BR>') : longData.what)
			before = "<BR><BR>"
		}
	}
}
*/