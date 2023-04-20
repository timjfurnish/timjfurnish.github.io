function AddCredit(title, who)
{
	return '<p style="text-align:left"><B>' + title + '</B><span style="float:right" align=right>' + who + '</span></p>'
}

function TabCredits()
{
	let arr = new Array()
	arr.push(AddCredit("Designed and coded by", "Tim Furnish"))
	arr.push(AddCredit("Testing", "Connor Furnish<BR>Ben Parbury"))
	return arr.join('')
}

WTAddPanelTab("CREDITS", TabCredits)