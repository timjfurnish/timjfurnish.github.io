function RenderBarFor(val, scale, dp, suffix)
{
	const num = val * scale
	const greenness = num * 2
	const col = "rgb(" + Math.floor(300 - greenness) + ", " + Math.floor(greenness) + ", " + Math.floor(255 - greenness) + ")"
	return '<DIV STYLE="width:' + Math.floor(num) + 'px;height:16px;background:' + col + '"><B><SMALL>' + ((dp === undefined) ? val : val.toFixed(dp)) + (suffix ?? '') + '</S<ALL></B></DIV>'
}

function TableOpen(reply)
{
	reply.push("<TABLE CELLPADDING=2 CELLSPACING=0 BORDER=1><TR>")
}

function TableNewRow(reply)
{
	reply.push("</TR><TR>")
}

function TableAddHeading(reply, h)
{
	reply.push('<td bgcolor=#DDDDDD><B>' + h + '</B>')
}

function OptionsMakeCheckbox(options, funcName, id, label)
{
	options.push('<INPUT TYPE="checkbox" onChange="' + funcName + '()" id="' + id + '"><LABEL FOR="' + id + '"> ' + (label ?? id) + '</LABEL>')
}