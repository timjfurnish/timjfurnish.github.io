//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

TabDefine("entities", function(reply, thenCall)
{
	var theDefault = undefined
	var beatThis = 0
	const keys = Object.keys(g_metaDataAvailableColumns)

	for (var eachOne of keys)
	{
		countOfMe = Object.keys(g_metaDataSeenValues[eachOne]).length
		
		if (theDefault === undefined || beatThis > countOfMe)
		{
			beatThis = countOfMe
			theDefault = eachOne
		}
	}
	
	TabBuildButtonsBar(reply, keys, theDefault)

	var options = []
	OptionsMakeCheckbox(options, "ShowContentForSelectedTab()", "showWithNoMentions", "Show columns with no mentions", true, true)
	reply.push(OptionsConcat(options) + "<BR>")

	TableOpen(reply)
	reply.push("<TD BGCOLOR=lightGray>")

	var allMentions = {}
	var segments = []
	var consolidateToHere = {}
	var addNumbers = {}
	
	function FinishSegment()
	{
		if ("name" in consolidateToHere)
		{
			Tally(addNumbers, consolidateToHere.rawName)

			if (g_currentOptions.entities.showWithNoMentions || Object.keys(consolidateToHere.entityMentions).length > 0)
			{
				reply.push('<TD CLASS="cellNoWrap" ALIGN=center VALIGN=bottom>')
				reply.push((consolidateToHere.name.length > 1) ? '<DIV CLASS="rotate90">' + consolidateToHere.name + "</DIV></TD>" : (consolidateToHere.name + "</TD>"))
				
				segments.push(consolidateToHere)
			}
		}
	}

	for (var metaData of g_metaDataInOrder)
	{
		const rawElementName = metaData.info[g_currentOptions.entities.page]
		const elementName = rawElementName + (addNumbers[rawElementName] ? " #" + (addNumbers[rawElementName] + 1) : "")
		
		if (consolidateToHere.rawName != rawElementName)
		{
			FinishSegment()
			consolidateToHere = {name:elementName, rawName:rawElementName, entityMentions:{}}
		}

		MetaDataCombine(consolidateToHere, "entityMentions", metaData.Mentions)

		for (var m of Object.keys(metaData.Mentions))
		{
			allMentions[m] = elementName
		}
	}
	
	FinishSegment()
	TableAddHeading(reply, "")

	// Totals...
	
	TableNewRow(reply)
	TableAddHeading(reply, "Num entities mentioned")
	for (var eachSegment of segments)
	{
		reply.push('<TD CLASS="cellNoWrap" ALIGN="center"><small>' + Object.keys(eachSegment.entityMentions).length + "</small>")
	}
	TableAddHeading(reply, "")

	TableNewRow(reply)
	TableAddHeading(reply, "Total mentions")
	var totalTotalMentions = 0
	for (var eachSegment of segments)
	{
		const num = Object.values(eachSegment.entityMentions).reduce((a,b)=>a+b, 0)
		reply.push('<TD CLASS="cellNoWrap" ALIGN="center"><small>' + num + "</small>")
		totalTotalMentions += num
	}
	TableAddHeading(reply, totalTotalMentions)

	const MakeCell = (bg, txt) => '<TD CLASS="cell" BGCOLOR=' + bg + '><FONT COLOR="white"><B>' + txt + '</B></FONT>'

	for (var [m,lastFoundInChapter] of Object.entries(allMentions))
	{
		reply.push('<TR ALIGN=CENTER><TD CLASS="cellNoWrap" ALIGN=left>' + m)
		reply.push('&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearchEntity(" + MakeParamsString(m) + ")"))
		var empty = true
		var totaliser = 0
		var colCount = 0

		function DrawEmptyCells()
		{
			if (colCount)
			{
				if (empty)
				{
					reply.push("<TD COLSPAN=" + colCount + ">")
				}
				else
				{
					reply.push('<TD COLSPAN=' + colCount + ' CLASS="cell" BGCOLOR="lightGray">-')
				}
				colCount = 0
			}
		}

		for (var eachSegment of segments)
		{
			if (m in eachSegment.entityMentions)
			{
				DrawEmptyCells()
				var num = eachSegment.entityMentions[m]
				totaliser += num
				const last = (eachSegment.name === lastFoundInChapter)
				if (empty)
				{
					reply.push(MakeCell(last ? "purple" : "green", num))
				}
				else
				{
					reply.push(MakeCell(last ? "red" : "blue", num))
				}
				empty = last
			}
			else
			{
				++ colCount
			}
		}
		DrawEmptyCells()
		reply.push('<TD CLASS="cell"><B>' + totaliser + '</B>')
	}
	
	TableClose(reply)
}, {icon:kIconEntities})