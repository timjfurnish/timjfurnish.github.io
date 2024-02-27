//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

g_tabFunctions.entities = function(reply, thenCall)
{
	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR><TD BGCOLOR=lightGray>")

	var allMentions = {}

	for (var headingInfo of g_headingToSentence)
	{
		reply.push('<TD CLASS="cellNoWrap" ALIGN=center VALIGN=bottom><DIV CLASS="rotate90">' + headingInfo.txt.split(' [')[0]) + "</DIV>"
		
		for (var m of Object.keys(headingInfo.mentionedInThisChapter))
		{
			allMentions[m] = headingInfo.txt
		}
	}

	reply.push('<TD BGCOLOR=lightGray CLASS="cellNoWrap">')

	const MakeCell = (bg, txt) => "<TD CLASS=cell BGCOLOR=" + bg + "><FONT COLOR=white><B>" + txt + "</B></FONT>"

	for (var [m,lastFoundInChapter] of Object.entries(allMentions))
	{
		reply.push('<TR ALIGN=CENTER><TD CLASS="cellNoWrap">' + m)
		var empty = true
		var totaliser = 0

		for (var headingInfo of g_headingToSentence)
		{
			if (m in headingInfo.mentionedInThisChapter)
			{
				var num = headingInfo.mentionedInThisChapter[m]
				totaliser += num
				const last = (headingInfo.txt == lastFoundInChapter)
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
			else if (empty)
			{
				reply.push("<TD>")
			}
			else
			{
				reply.push("<TD CLASS=cell BGCOLOR=lightGray>-")
			}
		}
		reply.push("<TD CLASS=cell><B>" + totaliser + "</B>")
	}
}