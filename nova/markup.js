//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_markupFunctions = {}

function SetMarkupFunction(character, func)
{
	g_markupFunctions[character] = func
}

function MarkupProcessedLine(txtInProcessed)
{
	const markupFunc = g_markupFunctions[txtInProcessed[0]]
	
	if (markupFunc)
	{
		markupFunc(txtInProcessed.substring(1))
		return true
	}
	
	return false
}