var s_thingsToAutoTest

function SetUpAutoTest()
{	
	s_thingsToAutoTest = Object.keys(s_puzzles)
	return {name:"Auto Test", content:"<DIV ID=autoTestResults></DIV>", thenCall:() =>
	{
		DisableButtonsIn("buttonsGoHere")
		setTimeout(tickAutoTest, 0)
	}}
}

function AutoTestGetErrorForPuzzle(puzzleData)
{
	if (! puzzleData)
	{
		return "No such puzzle"
	}
	
	const puzzleDecoded = NonoDecodePuzzle(puzzleData.data)

	if (! puzzleDecoded)
	{
		return "Failed to decode puzzle data"
	}
	
	const errorArray = []
	
	if (puzzleData.height != puzzleDecoded.length || puzzleData.width != puzzleDecoded[0].length)
	{
		errorArray.push("Size mismatch (claimed " + puzzleData.width + "x" + puzzleData.height + ", actually " + puzzleDecoded[0].length + "x" + puzzleDecoded.length + ")")
	}

	var difficulty = SolveForDesigner(puzzleDecoded).difficulty
	
	if (difficulty === undefined)
	{
		errorArray.push("Can't be solved")
	}
	else
	{
		difficulty += SolveForDesigner(puzzleDecoded, true).difficulty

		if (puzzleData.complexity != difficulty)
		{
			errorArray.push("Difficulty mismatch (claimed " + puzzleData.complexity + ", actually " + difficulty + ")")
		}
	}

	
	return errorArray.join('; ')
}

function tickAutoTest()
{
	const autoTestThis = s_thingsToAutoTest.pop()
	
	if (autoTestThis)
	{
		var error = AutoTestGetErrorForPuzzle(s_puzzles[autoTestThis])
		if (error !== "")
		{
			GetElement("autoTestResults").innerHTML += "<b>" + autoTestThis + "</b>: <font color=red>" + error + "</font><BR>"
		}
		setTimeout(tickAutoTest, 0)
	}
	else
	{
		GetElement("autoTestResults").innerHTML += "Tests complete!"
		s_thingsToAutoTest = undefined
		EnableButtons()
	}
}