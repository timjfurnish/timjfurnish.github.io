function WTTag(theTags, theContents)
{
	let tags = theTags.split('|')
	let numTags = tags.length
	
	for (let i = numTags - 1; i >= 0; -- i)
	{
		let theTag = tags[i]

		if (theTag != '')
		{
			let name = theTag.split(' ')
			theContents = "<" + theTag + ">" + theContents + "</" + name[0] + ">"
		}
	}

	return theContents
}

function WTBuildBubble(grad, borderCol, radius, pad)
{
	return "border-radius: " + radius + "px; background: -webkit-" + grad + "; background: -o-" + grad + "; background: -moz-" + grad + "; background: " + grad + "; border: 2px solid " + borderCol + "; padding: " + pad + "px"
}

function WTBuildButton(showText, script)
{
	let bubble = 'span style="' + WTBuildBubble(s_wtSettings.buttonGradient, '#555577', 15, 5) + '"'
	return WTTag(s_wtSettings.font + '|a href="javascript:' + script + '" style="text-decoration:none; text-shadow: 2px 2px #333355"|' + bubble + '|b', '&nbsp;' + showText + '&nbsp;')
}

function WTBuildPanel()
{
	let ar = new Array()
	ar.push('<td colspan=3 width=80% style="' + WTBuildBubble(s_wtSettings.panelGradient, '#555577', 25, 20) + '; width: 200px; height: 150px">')
	ar.push('<table height="100%" width="100%">')
	ar.push(WTTag('tr|td valign=top|' + s_wtSettings.font + '|center id="PANELTABS"', ''))
	ar.push(WTTag('tr|td valign=center style="color: ' + s_wtSettings.panelTextCol + '"|' + s_wtSettings.font + '|center id="OPTIONSCONTENTS"', ''))
	ar.push(WTTag('tr|td valign=bottom|center id=CLOSEPANEL', WTBuildButton('OK', 'WTShowPanel()')))
	ar.push('</table>')
	ar.push('</td>')
	return '<td width=10%></td>' + ar.join('') + '<td width=10%></td>'
}

function WTWriteTable()
{
	let contents = WTTag(s_wtSettings.headerFont, '<BIG><BIG>' + s_wtSettings.gameName + '</BIG></BIG><BR><SMALL><SMALL>' + s_wtSettings.byline + '</SMALL></SMALL>')

	document.write('<center><table width=90% height=95% cellpadding=0 cellspacing=0 border=0>')
	document.write(WTTag('tr|td colspan=5 align=center valign=center height="15%" ID="TITLE"', contents))
	document.write(WTTag('tr id="GAMEROW" height="50%"|td colspan=5 align=center valign=center ID="GAMEHERE"|' + s_wtSettings.font + '|p id="TEXTAREA" align=center', '- LOADING -'))
	document.write(WTTag('tr id="OPTIONSROW" height=50% style="display: none"', WTBuildPanel()))
	document.write('<tr>')
	document.write(WTTag('td align=left colspan=2 valign=bottom height="15%" width="30%" id="SMALLER"', WTBuildButton('&#8209;', 'smaller()')))
	document.write(WTTag('td align=center valign=bottom height="15%" width="40%" id="OPTIONSLINK"|small', WTBuildButton('HELP', 'WTShowPanel()')))
	document.write(WTTag('td align=right colspan=2 valign=bottom height="15%" width="30%" id="BIGGER"', WTBuildButton('+', 'bigger()')))
	document.write('</tr></table></center>')
}

WTWriteTable()