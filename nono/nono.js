var s_activePuzzleSolutionSoFar = null
var s_autoSolveData = null
var s_columnClues = null
var s_rowClues = null
var s_busy = false
var s_oldHighlightId = null

const s_cycle = {[' ']:'1', ['1']:'.', ['.']:' '}

function NonoSetUp()
{
	const output = []
	output.push('<BUTTON onClick="SetUpPuzzle()">PLAY RANDOM PUZZLE</BUTTON>')
	output.push('<BUTTON onClick="navigation.navigate(\'/\')">EXIT</BUTTON>')
	GetElement("toHere").innerHTML = '<h2>Welcome!</h2>' + output.join('<BR>')
	
	s_activePuzzleSolutionSoFar = null
	s_autoSolveData = null
	s_columnClues = null
	s_rowClues = null
	s_oldHighlightId = null
}

function SetBusy(onOff)
{
	s_busy = onOff

	for (var eachButton of GetElement("toHere").getElementsByTagName("BUTTON"))
	{
		eachButton.disabled = onOff
	}
}

function Highlight(id)
{
	const oldElem = s_oldHighlightId ? GetElement(s_oldHighlightId) : null
	if (oldElem)
	{
		oldElem.bgColor = ""
	}
	
	const newElem = id ? GetElement(id) : null
	if (newElem)
	{
		newElem.bgColor = "#66FF66"
	}
	
	s_oldHighlightId = id
}

function SetUpPuzzle()
{
	const output = []
	const puzzleIn = ["11   11111", "1  1 1   1", "  11 1 1  ", "  11   11 ", "          ", "11  1 1 11", "1        1", "  1 111   ", "1 1  1   1", "   11111  ", "1        1", "11      11"]
//	const puzzleIn = [" 11 11    ", " 111 11   ", " 11  111  ", " 1   1111 ", "1111111111", " 1      1 ", " 1 1 11 1 ", " 1 1 11 1 ", " 1      1 ", " 1 11 1 1 ", " 1 11 1 1 ", " 1 11   1 "]
	const height = puzzleIn.length
	const width = puzzleIn[0].length

	s_activePuzzleSolutionSoFar = []
	s_autoSolveData = {solveColumns: false, solveIndex: 0, anythingChanged: true}
	s_columnClues = []
	s_rowClues = []
	s_oldHighlightId = null

	output.push("<TABLE><TR><TD></TD>")
	for (var x = 0; x < width; ++ x)
	{
		const columnClues = CalcClues(GetColumnFromGrid(puzzleIn, x))
		s_columnClues.push(columnClues)
		output.push('<TD id="col' + x + '" align=center valign=bottom width=40>' + columnClues.join('<BR>') + '</TD>')
	}
	output.push("</TR>")
	for (var y = 0; y < height; ++ y)
	{
		var buildLine = []
		const rowClues = CalcClues(puzzleIn[y])
		s_rowClues.push(rowClues)
		output.push("<TR align=center><TD id=\"row" + y + "\" align=right>" + rowClues.join(' ') + "</TD>")
		for (var x = 0; x < width; ++ x)
		{
			output.push('<TD id="gridCell' + x + '.' + y + '" width=40 height=40 onClick="ClickGrid(' + x + ',' + y + ')" BGCOLOR=#DDDDDD></TD>')
			buildLine.push(" ")
		}
		output.push("</TR>")
		s_activePuzzleSolutionSoFar.push(buildLine)
	}
	output.push("</TABLE><BR>")
	output.push('<BUTTON onClick="SetBusy(true); SolveStep()">SOLVE</BUTTON><BR>')
	output.push('<BUTTON onClick="NonoSetUp()">EXIT</BUTTON>')
	GetElement("toHere").innerHTML = '<h2>Random Puzzle!</h2>' + output.join('')
}

function ClickGrid(x, y)
{
	if (! s_busy)
	{
		SetCell(x, y, s_cycle[s_activePuzzleSolutionSoFar[y][x]])
	}
}

function GetElement(id)
{
	const elem = document.getElementById(id)
	
	if (! elem)
	{
		console.warn("No element called '" + name + "'")
	}
	
	return elem
}

function SetCell(x, y, newContents)
{
	const elem = GetElement('gridCell' + x + '.' + y)
	
	if (newContents === undefined || newContents.length != 1)
	{
		console.warn("newContents='" + newContents + "' for " + x + ", " + y)
	}

	s_activePuzzleSolutionSoFar[y][x] = newContents
	
	if (elem)
	{
		if (newContents == '.')
		{
			elem.innerHTML = "—"
			elem.bgColor = '#DDDDDD'
		}
		else
		{
			elem.innerHTML = ""
			if (newContents == '1')
			{
				elem.bgColor = '#222222'
			}
			else
			{
				elem.bgColor = '#DDDDDD'
			}
		}
	}
}

function SolveStep()
{
	var bSwitchColsRows = false
	var bDidSomething = false

	while (!bDidSomething)
	{
		if (s_autoSolveData.solveColumns)
		{
			const alreadyInColumn = GetColumnFromGrid(s_activePuzzleSolutionSoFar, s_autoSolveData.solveIndex)
			const newDataForColumn = TryToSolve(alreadyInColumn, s_columnClues[s_autoSolveData.solveIndex])
			
			if (newDataForColumn)
			{
				Highlight("col" + s_autoSolveData.solveIndex)
				for (var y = 0; y < newDataForColumn.length; ++ y)
				{
					SetCell(s_autoSolveData.solveIndex, y, newDataForColumn[y])
				}

				s_autoSolveData.anythingChanged = true
				bDidSomething = true
			}
			
			++ s_autoSolveData.solveIndex
			bSwitchColsRows = (s_autoSolveData.solveIndex >= s_activePuzzleSolutionSoFar[0].length)
		}
		else
		{
			const alreadyInRow = s_activePuzzleSolutionSoFar[s_autoSolveData.solveIndex]
			const newDataForRow = TryToSolve(alreadyInRow, s_rowClues[s_autoSolveData.solveIndex])

			if (newDataForRow)
			{
				Highlight("row" + s_autoSolveData.solveIndex)
				for (var x = 0; x < newDataForRow.length; ++ x)
				{
					SetCell(x, s_autoSolveData.solveIndex, newDataForRow[x])
				}

				s_autoSolveData.anythingChanged = true
				bDidSomething = true
			}

			++ s_autoSolveData.solveIndex
			bSwitchColsRows = (s_autoSolveData.solveIndex >= s_activePuzzleSolutionSoFar.length)
		}
		
		if (bSwitchColsRows)
		{
			s_autoSolveData.solveColumns = !s_autoSolveData.solveColumns
			s_autoSolveData.solveIndex = 0
			
			if (! s_autoSolveData.anythingChanged)
			{
				Highlight(null)
				SetBusy(false)
				alert("That's all I can do, it's either solved or can't be solved")
				return
			}
			
			s_autoSolveData.anythingChanged = false
		}
	}
	
	setTimeout(SolveStep, 100)
}

function TryToSolveSection(combineHere, startWith, clues, fromClueIndex, alreadyContains)
{
	if (fromClueIndex >= clues.length)
	{
		var paddedWithDots = startWith
		while (paddedWithDots.length < combineHere.length)
		{
			paddedWithDots += '.' 
		}
			
		for (var checkMatch = 0; checkMatch < alreadyContains.length; ++ checkMatch)
		{
			if (! (alreadyContains[checkMatch] == ' ' || alreadyContains[checkMatch] == paddedWithDots[checkMatch]))
			{
				return false
			}
		}
		
		for (var combine = 0; combine < combineHere.length; ++ combine)
		{
			if (combineHere[combine] == '?')
			{
				combineHere[combine] = paddedWithDots[combine]
			}
			else if (combineHere[combine] != paddedWithDots[combine])
			{
				combineHere[combine] = ' '
			}
		}

		return
	}

	var buildPotential = startWith
	var spacer = ""

	if (startWith != "")
	{
		buildPotential += '.'
	}
	
	const thisClue = clues[fromClueIndex]
	for (var i = buildPotential.length; i <= combineHere.length - thisClue; ++ i)
	{
		var possible = buildPotential + spacer
		for (var j = 0; j < thisClue; ++ j)
		{
			possible += '1'
		}
		TryToSolveSection(combineHere, possible, clues, fromClueIndex + 1, alreadyContains)
		spacer += "."
	}
}

function TryToSolve(alreadyContains, clues)
{
	var combineHere = []
	for (var ch of alreadyContains)
	{
		combineHere.push('?')
	}

	TryToSolveSection(combineHere, "", clues, 0, alreadyContains)

	var was = alreadyContains.join('')
	var isNow = combineHere.join('')

	return (was != isNow) ? combineHere : null
}

function CalcClues(strIn)
{
	const clues = []
	var lastChar = ' '
	var count = 0
	
	for (var ch of strIn)
	{
		if (lastChar == ch)
		{
			++ count
		}
		else
		{
			if (lastChar != ' ')
			{
				clues.push(count)
			}
			
			lastChar = ch
			count = 1
		}
	}
	
	if (lastChar != ' ')
	{
		clues.push(count)
	}
	
	return clues
}

function GetColumnFromGrid(grid, columnNum)
{
	var out = []
	for (var row of grid)
	{
		out.push(row[columnNum])
	}
	return out
}