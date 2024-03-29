//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_threadSections = []
var g_threadSectionSelected = 0
var g_threadSectionFragment = 0

const kIndent = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"

function TurnRedIf(input, condition)
{
	return condition ? "<FONT COLOR=Red>" + input + "</FONT>" : input
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

		if (entityNames && g_metaDataInOrder.length)
		{
			var names = entityNames.split('+')
			var aBreak = ""
			const theString = "\\b(?:" + names.join('|') + ")\\b"
			const exp = new RegExp(theString, "ig");

			console.log("Searching for " + theString)

			for (var metadata of g_metaDataInOrder)
			{
				var showHeading = "<H3>" + MetaDataMakeFragmentDescription(metadata.info) + "</H3>"
				var before = ""

				for (var para of metadata.myParagraphs)
				{
					var nextBefore = aBreak

					if (! para.ignoreFragments)
					{
						var s2 = para.allOfIt.replace(exp, Highlighter)

						if (para.allOfIt != s2)
						{
							if (showHeading)
							{
								before = showHeading
								showHeading = false
							}

							output.push(before + kIndent + TurnRedIf(s2, para.issues))
							nextBefore = ""
							aBreak = "<br>"
						}
					}
					
					before = nextBefore
				}
			}
		}

		mentionsGoHere.innerHTML = output.join('<BR>')
	}
}

TabDefine("mentions", function(reply, thenCall)
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
	reply.push("<p id=mentionsGoHere align=left></p>")
	
	thenCall.push(RedrawMentions)
}, kIconSearch)

function HighlightThreadSection(num, bCanScroll)
{
	speechSynthesis.cancel()
	
	if (num >= 0 && num < g_threadSections.length)
	{
		if (g_threadSectionSelected != num)
		{
			TrySetElementClass("threadSection" + g_threadSectionSelected, "highlighter", false)
		}

		g_threadSectionSelected = num
		g_threadSectionFragment = 0
		const theElement = TrySetElementClass("threadSection" + num, "highlighter", true)
		
		if (theElement && bCanScroll)
		{
			const rect = theElement.getBoundingClientRect()
			
			if (rect.bottom > window.innerHeight * 0.8)
			{
				window.scrollTo(0, rect.top + window.scrollY - window.innerHeight * 0.2)
			}
			else if (rect.top < window.innerHeight * 0.2)
			{
				window.scrollTo(0, rect.bottom + window.scrollY - window.innerHeight * 0.8)
			}
		}
	}
	
//	SetTabTitle('threads', g_threadSectionSelected)
	
	return num == g_threadSectionSelected
}

function RedrawThread()
{
	var threadsGoHere = document.getElementById("threadsGoHere")

	var lastHeading = ""
	
	g_threadSections = []
	g_threadSectionSelected = 0

	if (threadsGoHere)
	{
		var output = []
		var mustMatch = g_currentOptions.threads.showThis

		for (var metadata of g_metaDataInOrder)
		{
			var showHeading = "<H3>" + MetaDataMakeFragmentDescription(metadata.info) + "</H3>"
			var before = ""
			
			if (metadata.info[g_currentOptions.threads.page] == mustMatch)
			{
				for (var para of metadata.myParagraphs)
				{
					if (showHeading)
					{
						before = showHeading
						showHeading = false
					}

					output.push(before + kIndent + '<SPAN CLASS="clicky" ONCLICK="HighlightThreadSection(' + g_threadSections.length + ')" ID="threadSection' + g_threadSections.length + '">' + TurnRedIf(para.allOfIt, para.issues) + '</SPAN>')
					g_threadSections.push(para)
					
					before = ""
				}
			}
		}

		threadsGoHere.innerHTML = output.join('<BR>')
	}
	
	HighlightThreadSection(g_threadSectionSelected)
}

function OnDoneThreadSpeakingFragment()
{
	++ g_threadSectionFragment
	ThreadRead()
}

function ThreadRead()
{
	const thingToSay = g_threadSections[g_threadSectionSelected]
	if (thingToSay)
	{
		const fragment = thingToSay.fragments[g_threadSectionFragment]
		if (fragment)
		{
			SpeakUsingVoice(fragment.text + fragment.followedBy, fragment.isSpeech ? "voiceSpeech" : "voiceDefault", OnDoneThreadSpeakingFragment)
		}
		else if (HighlightThreadSection(g_threadSectionSelected + 1, true))
		{
			CallTheseFunctions(ThreadRead)
		}
	}
}

TabDefine("threads", function(reply, thenCall)
{
	const columns = Object.keys(g_metaDataAvailableColumns)
	
	if (columns.length)
	{
		TabBuildButtonsBar(reply, columns)
		
		var nameData = {[""]:""}

		for (var metadata of g_metaDataInOrder)
		{
			const txt = metadata.info[g_currentOptions.threads.page]
			nameData[txt] = txt
		}
		
		var options = []
		var hoverOptions = []
		OptionsMakeSelect(options, "RedrawThread()", "Only show text from " + g_currentOptions.threads.page.toLowerCase(), "showThis", nameData, "", true)
		hoverOptions.push('<button onclick="HighlightThreadSection(g_threadSectionSelected - 1, true)">&lt;</button>')
		hoverOptions.push('<button onclick="HighlightThreadSection(g_threadSectionSelected + 1, true)">&gt;</button>')
		hoverOptions.push('<BUTTON ONCLICK="ThreadRead()">Read</BUTTON>')
		hoverOptions.push('<BUTTON ONCLICK="speechSynthesis.cancel()">Stop</BUTTON>')
		hoverOptions.push('<BUTTON ONCLICK="window.scrollTo(0,0)">' + kIconToTop + '</BUTTON>')

		reply.push(OptionsConcat(options))
		reply.push("<p id=threadsGoHere align=left></p>")
		
		ShowHoverControls(hoverOptions)
		
		thenCall.push(RedrawThread)
	}
}, kIconSpeech)

//---------------------------------------
// Switch to here from another tab
//---------------------------------------

function SwitchToMentionsAndSearchEntity(txt)
{
	const specificNames = SettingsGetNamesArrayArray()

	for (var name of specificNames)
	{
		if (txt == name[0])
		{
			const searchFor = name.join('+')
			OptionsMakeKey("mentions", "entity", searchFor, true)
			OptionsMakeKey("mentions", "custom", searchFor, true)
			SetTab("mentions")
			return
		}
		else if (txt.toUpperCase() == name[0].toUpperCase())
		{
			console.log("Suspicious! Text in '" + txt + "' NEARLY matches '" + name[0] + "'")
		}
	}

	ShowError("SwitchToMentionsAndSearchEntity failed to find '" + txt + "'")
}

function SwitchToMentionsAndSearch(txt)
{
	OptionsMakeKey("mentions", "entity", "", true)
	OptionsMakeKey("mentions", "custom", txt, true)
	SetTab("mentions")
}

function MakeMentionLink(showText, searchForText)
{
	return showText + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(searchForText ?? showText) + ")")
}