//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_numInputBoxes = 0

function AddAllInputBoxes()
{
	for (var i = 0; i < g_tweakableSettings.numTextBoxes; ++ i)
	{
		addInputBox(false)
	}
}

function addInputBox(saveIt)
{
	document.getElementById('inputs').innerHTML += '<textarea class="docIn" id="txtIn' + ++ g_numInputBoxes + '" onChange="ProcessInput()"></textarea><BR>'
	
	if (saveIt)
	{
		SettingUpdate('numTextBoxes', g_numInputBoxes)
	}
}

function mergeInputBoxes()
{
	const contents = GetInputTextRaw()

	document.getElementById('inputs').innerHTML = ''
	g_numInputBoxes = 0
	addInputBox(true)
	
	document.getElementById('txtIn1').value = contents
}

function ClearInputBoxes()
{
	for (var n = 1; n <= g_numInputBoxes; ++ n)
	{
		document.getElementById('txtIn' + n).value = ''
	}
}

async function pasteToInputBox()
{
	try
	{
		const theText = await navigator.clipboard.readText()
		document.getElementById('inputs').innerHTML = ''
		g_numInputBoxes = 0
		addInputBox(true)
		document.getElementById("txtIn1").value = theText
		ProcessInput()
	}
	catch (error)
	{
		console.warn('Failed to read clipboard: ' + error)
	}
}

function hideShowInputs(checked)
{
	document.getElementById('inputsControls').style.display = checked ? '' : 'none'
	document.getElementById('inputs').style.display = checked ? "block" : "none"
}

function GetInputTextRaw()
{
	var reply = []

	for (var n = 1; n <= g_numInputBoxes; ++ n)
	{
		reply.push(document.getElementById('txtIn' + n).value)
	}
	
	return reply.join('\n').replace(/\</g, '[').replace(/\>/g, ']')
}

function GetInputText()
{
	var reply = GetInputTextRaw()

	reply = reply.replace(/[\u201C\u201D]/g, '"')
	reply = reply.replace(/[\u2018\u2019]/g, "'")
	reply = reply.replace(/([0-9]+:)\n([^\n])/g, '$1: $2')
	
	return reply.split(/[\n]+/)
}
