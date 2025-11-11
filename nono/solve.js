var s_autoSolveData = null

function SolveStart(stopAfterSingleHint)
{
	s_autoSolveData = {count: 0, solveColumns: false, solveIndex: 0, anythingChanged: true, skip: {cols: {}, rows: {}}, stopAfterSingleHint:stopAfterSingleHint}
	SetBusy(true)
	SolveStep()
}

function Hint()
{
	var bSwitchColsRows = false
	var bDidSomething = false

	while (!bDidSomething)
	{
		if (s_autoSolveData.solveColumns)
		{
			if (! s_autoSolveData.skip.cols[s_autoSolveData.solveIndex] && !s_completeness.cols[s_autoSolveData.solveIndex])
			{
				const alreadyInColumn = GetColumnFromGrid(s_activePuzzleSolutionSoFar, s_autoSolveData.solveIndex)
				const newDataForColumn = TryToSolve(alreadyInColumn, s_clues.cols[s_autoSolveData.solveIndex])
				const bUnfinished = (s_completeness.total < (s_clues.rows.length + s_clues.cols.length))
				
				if (newDataForColumn)
				{
					Highlight("col" + s_autoSolveData.solveIndex, "#66FF66")
					for (var y = 0; y < newDataForColumn.length; ++ y)
					{
						if (SetCell(s_autoSolveData.solveIndex, y, newDataForColumn[y]))
						{
							delete s_autoSolveData.skip.rows[y]
						}
					}

					if (s_autoSolveData.stopAfterSingleHint)
					{
						Highlight(null)
						return true
					}

					s_autoSolveData.anythingChanged = true
				}
				else
				{
					Highlight("col" + s_autoSolveData.solveIndex, "red")
					s_autoSolveData.skip.cols[s_autoSolveData.solveIndex] = true
				}
				
				if (bUnfinished)
				{
					++ s_autoSolveData.count
				}
				
				bDidSomething = true
			}
			
			++ s_autoSolveData.solveIndex
			bSwitchColsRows = (s_autoSolveData.solveIndex >= s_activePuzzleSolutionSoFar[0].length)
		}
		else
		{
			if (! s_autoSolveData.skip.rows[s_autoSolveData.solveIndex] && !s_completeness.rows[s_autoSolveData.solveIndex])
			{
				const alreadyInRow = s_activePuzzleSolutionSoFar[s_autoSolveData.solveIndex]
				const newDataForRow = TryToSolve(alreadyInRow, s_clues.rows[s_autoSolveData.solveIndex])
				const bUnfinished = (s_completeness.total < (s_clues.rows.length + s_clues.cols.length))

				if (newDataForRow)
				{
					Highlight("row" + s_autoSolveData.solveIndex, "#66FF66")
					for (var x = 0; x < newDataForRow.length; ++ x)
					{
						if (SetCell(x, s_autoSolveData.solveIndex, newDataForRow[x]))
						{
							delete s_autoSolveData.skip.cols[x]
						}
					}

					if (s_autoSolveData.stopAfterSingleHint)
					{
						Highlight(null)
						return true
					}

					s_autoSolveData.anythingChanged = true
				}
				else
				{
					Highlight("row" + s_autoSolveData.solveIndex, "red")
					s_autoSolveData.skip.rows[s_autoSolveData.solveIndex] = true
				}

				if (bUnfinished)
				{
					++ s_autoSolveData.count
				}

				bDidSomething = true
			}
			
			++ s_autoSolveData.solveIndex
			bSwitchColsRows = (s_autoSolveData.solveIndex >= s_activePuzzleSolutionSoFar.length)
		}
		
		if (bSwitchColsRows)
		{
//			console.log("Finished trying to solve " + (s_autoSolveData.solveColumns ? "columns" : "rows") + "; skip.cols=" + Object.keys(s_autoSolveData.skip.cols) + " skip.rows=" + Object.keys(s_autoSolveData.skip.rows))

			s_autoSolveData.solveColumns = !s_autoSolveData.solveColumns
			s_autoSolveData.solveIndex = 0
			
			if (! s_autoSolveData.anythingChanged)
			{
				Highlight(null)
				return true
			}
			
			s_autoSolveData.anythingChanged = false
		}
	}
	
	return false
}

function SolveStep()
{
	if (Hint())
	{
		if (s_autoSolveData.stopAfterSingleHint)
		{
			SetBusy(false)
			s_autoSolveData = null
		}
		else if (s_completeness.total < (s_clues.rows.length + s_clues.cols.length))
		{
			setTimeout(SolveFail, 200)
		}
		else
		{
			setTimeout(SolveDone, 200)
		}
	}
	else
	{
		setTimeout(SolveStep, 1)
	}
}

function SolveDone()
{
	SetBusy(false)
	alert("Solved!\nCount = " + s_autoSolveData.count)
	s_autoSolveData = null
}

function SolveFail()
{
	SetBusy(false)
	alert("Failed to solve puzzle!")
	s_autoSolveData = null
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
