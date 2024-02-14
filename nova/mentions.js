//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_nameLookup, g_txtForMentions, g_currentlyBuildingChapter, g_permittedNameCapitalisations

OnEvent("clear", () =>
{
	g_nameLookup = {}
	g_permittedNameCapitalisations = {}

	for (var nameList of SettingsGetNamesArrayArray())
	{
		for (var name of nameList)
		{
			g_nameLookup[name.toLowerCase()] = nameList[0]
			g_permittedNameCapitalisations[name] = true
			g_permittedNameCapitalisations[CapitaliseFirstLetter(name)] = true
			g_permittedNameCapitalisations[name.toUpperCase()] = true
		}
	}

	g_txtForMentions = []
	MentionsStoreHeading("Global")
})

function MentionsStoreHeading(heading)
{
	g_issueHeading = heading
	g_currentlyBuildingChapter = {paragraphs:[], heading:heading}
	g_txtForMentions.push(g_currentlyBuildingChapter)
}

function MentionsStoreParagraph(para)
{
	g_currentlyBuildingChapter.paragraphs.push(para)
}

function RedrawMentions()
{
	var mentionsGoHere = document.getElementById("mentionsGoHere")
	var customTextBox = document.getElementById("mentions.custom")

	var lastHeading = ""

	if (mentionsGoHere && customTextBox)
	{
		var output = []
		var entityNames = document.getElementById("mentions.entity")?.value

		if (entityNames)
		{
			customTextBox.value = entityNames
			customTextBox.readOnly = true
		}
		else
		{
			entityNames = customTextBox.value
			customTextBox.readOnly = false
		}

		if (g_txtForMentions && entityNames && g_txtForMentions.length)
		{
			var names = entityNames.split('+')
			var aBreak = ""
			const theString = "\\b(?:" + names.join('|') + ")\\b"
			const exp = new RegExp(theString, "ig");

			console.log("Searching through " + g_txtForMentions.length + " paragraphs for " + theString)

			for (var chapter of g_txtForMentions)
			{
				var showHeading = "<H3>" + chapter.heading + "</H3>"
				var before = ""

				for (var para of chapter.paragraphs)
				{
					var nextBefore = aBreak
					var s2 = para.replace(exp, Highlighter)
					if (para != s2)
					{
						if (showHeading)
						{
							before = showHeading
							showHeading = false
						}

						output.push(before + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + s2)
						nextBefore = ""
						aBreak = "<br>"
					}
					
					before = nextBefore
				}
			}
		}

		mentionsGoHere.innerHTML = output.join('<BR>')
	}
}

g_tabFunctions.mentions = function(reply, thenCall)
{
	const specificNames = SettingsGetNamesArrayArray()
	var nameData = {[""]:"Custom"}

	for (var name of specificNames)
	{
		nameData[name.join('+')] = CapitaliseFirstLetter(name[0])
	}
	
	var options = []
	OptionsMakeSelect(options, "RedrawMentions()", "Entity", "entity", nameData, "")
	OptionsMakeTextBox(options, "RedrawMentions()", "Search for", "custom")
	reply.push(OptionsConcat(options))
	reply.push("<p id=mentionsGoHere></p>")
	
	thenCall.push(RedrawMentions)
}

function SwitchToMentionsAndSearch(txt)
{
	OptionsMakeKey("mentions", "entity", "", true)
	OptionsMakeKey("mentions", "custom", txt, true)
	SetTab("mentions")
}

function MakeMentionLink(showText, searchForText)
{
	return '<NOBR>' + showText + ' ' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch('" + (searchForText ?? showText) + "')") + '</NOBR>'
}