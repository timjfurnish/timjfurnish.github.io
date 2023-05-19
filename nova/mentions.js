function RedrawMentions()
{
	var mentionsGoHere = document.getElementById("mentionsGoHere")
	var mentionsOfType = document.getElementById("searchThese")?.value
	var entityNames = document.getElementById("entity")?.value

	var searchThese = (mentionsOfType == "para") ? g_txtInArray : g_sentences
	
	if (mentionsGoHere && searchThese && entityNames && searchThese.length)
	{
		var output = []
		var names = entityNames.split('+')
		var before = ""
		var aBreak = ""
		const theString = "\\b(?:" + names.join('|') + ")\\b"
		const exp = new RegExp(theString, "ig");

		console.log("Searching through " + searchThese.length + " x " + mentionsOfType + " for " + theString)

		for (var sentence of searchThese)
		{
			if (sentence.text)
			{
				sentence = sentence.text
			}
			
			var nextBefore = aBreak
			var s2 = sentence.replace(exp, Highlighter)
			if (sentence != s2)
			{
				output.push(before + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + s2.replace(/\^/g, ''))
				nextBefore = ""
				aBreak = "<br>"
			}
			
			before = nextBefore
		}
		mentionsGoHere.innerHTML = output.join('<BR>')
	}
}

g_tabFunctions.mentions = function(reply, thenCall)
{
	const specificNames = SettingsGetNamesArrayArray()

	if (specificNames.length)
	{
		reply.push('<nobr>Entity: <select id="entity" onChange="RedrawMentions()">')

		for (var name of specificNames)
		{
			reply.push('<option value=' + name.join('+') + '>' + name[0].charAt(0).toUpperCase() + name[0].slice(1) + '</option>')
		}
		
		reply.push('</select> </nobr><nobr>Display: <select id="searchThese" onChange="RedrawMentions()">')
		reply.push('<option value=para>Paragraphs</option>')
		reply.push('<option value=sent>Sentences</option>')
		reply.push('</select></nobr><BR><BR>')
	}
	reply.push("<div id=mentionsGoHere></div>")
	
	thenCall.push(RedrawMentions)
}