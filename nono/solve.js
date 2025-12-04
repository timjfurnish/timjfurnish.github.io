var s_autoSolveData = null

function SolveStart(stopAfterSingleHint)
{
	s_autoSolveData = {solveColumns: false, solveIndex: 0, anythingChanged: true, skip: {cols: {}, rows: {}}, stopAfterSingleHint:stopAfterSingleHint}
	s_autoPaint = null

	DisableButtonsIn("buttonsGoHere")
	SolveStep()
}

function ShouldSkipInitialPass(clues, cells)
{
	if (clues.length)
	{
		var cellsNeeded = 0
		var pad = 0
		var biggest = 0

		for (var n of clues)
		{
			cellsNeeded += pad + n
			pad = 1
			biggest = Math.max(biggest, n)
		}
		
//		console.log("Clues [" + clues + "] need " + cellsNeeded + "/" + cells + " cells, biggest=" + biggest)
		return biggest <= cells - cellsNeeded
	}
	
	return false
}

function SolveForDesigner(grid, solveColumns)
{
	var skip = {cols:{}, rows:{}}
	var solveIndex = 0
	var count = 0
	var anythingChanged = true

	const clues = {cols:[], rows:[]}
	const sizes = {cols:grid[0].length, rows:grid.length}
	const solveHere = CreateEmptyGridOfSize(sizes.cols, sizes.rows)
	const completeness = {rows:[], cols:[], total:0, needed:sizes.cols + sizes.rows}

	// Build clues
	for (var x = 0; x < sizes.cols; ++ x)
	{
		const cluesForColumn = CalcClues(GetColumnFromGrid(grid, x))
		clues.cols.push(cluesForColumn)
		if (ShouldSkipInitialPass(cluesForColumn, sizes.rows))
		{
			skip.cols[x] = true
		}
	}

	for (var y = 0; y < sizes.rows; ++ y)
	{
		const cluesForRow = CalcClues(grid[y])
		clues.rows.push(CalcClues(grid[y]))
		if (ShouldSkipInitialPass(cluesForRow, sizes.cols))
		{
			skip.rows[y] = true
		}
	}

/*
	console.log("==============================================================")
	console.log("Trying to solve puzzle - " + (solveColumns ? "columns" : "rows") + " first")
	console.log("Skip columns " + Object.keys(skip.cols).join(" "))
	console.log("Skip rows " + Object.keys(skip.rows).join(" "))
	console.time(solveColumns ? "Solve_cols" : "Solve_rows")
*/

	// Solve
	for (;;)
	{
		const colsOrRows = solveColumns ? "cols" : "rows"
		const skipColsOrRows = solveColumns ? "rows" : "cols"
	
		if (! skip[colsOrRows][solveIndex] && !completeness[colsOrRows][solveIndex])
		{
			const already = solveColumns ? GetColumnFromGrid(solveHere, solveIndex) : solveHere[solveIndex]
			var bCompleteNow = !already.includes(' ')
			
			if (!bCompleteNow)
			{
				const newData = TryToSolve(already, clues[colsOrRows][solveIndex])
				
				if (newData)
				{
					for (var i = 0; i < newData.length; ++ i)
					{
						if (solveColumns)
						{
							if (solveHere[i][solveIndex] != newData[i])
							{
								delete skip.rows[i]
								solveHere[i][solveIndex] = newData[i]
							}
						}
						else
						{
							if (solveHere[solveIndex][i] != newData[i])
							{
								delete skip.cols[i]
								solveHere[solveIndex][i] = newData[i]
							}
						}
					}

					bCompleteNow = !newData.includes(' ')
					anythingChanged = true
				}

				if (! bCompleteNow)
				{
					++ count
				}
			}
			
			if (bCompleteNow)
			{
				completeness[colsOrRows][solveIndex] = true
				++ completeness.total
				
				if (completeness.total == completeness.needed)
				{
//					console.timeEnd("Solve_" + colsOrRows)
					solveHere.difficulty = count
					return solveHere
				}
			}

			skip[colsOrRows][solveIndex] = true
		}
		
		++ solveIndex

		if (solveIndex >= sizes[colsOrRows])
		{
//			console.timeEnd("Solve_" + colsOrRows)

			solveColumns = !solveColumns
			solveIndex = 0
			
			if (! anythingChanged)
			{
				return solveHere
			}
			
//			console.time("Solve_" + skipColsOrRows)
			anythingChanged = false
		}
	}
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
					Highlight(["col" + s_autoSolveData.solveIndex], "#66FF66")
					for (var y = 0; y < newDataForColumn.length; ++ y)
					{
						if (SetCell(s_autoSolveData.solveIndex, y, newDataForColumn[y]))
						{
							delete s_autoSolveData.skip.rows[y]
						}
					}

					if (s_autoSolveData.stopAfterSingleHint)
					{
						Highlight()
						return true
					}

					s_autoSolveData.anythingChanged = true
				}
				else
				{
					Highlight(["col" + s_autoSolveData.solveIndex], "red")
					s_autoSolveData.skip.cols[s_autoSolveData.solveIndex] = true
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
					Highlight(["row" + s_autoSolveData.solveIndex], "#66FF66")
					for (var x = 0; x < newDataForRow.length; ++ x)
					{
						if (SetCell(x, s_autoSolveData.solveIndex, newDataForRow[x]))
						{
							delete s_autoSolveData.skip.cols[x]
						}
					}

					if (s_autoSolveData.stopAfterSingleHint)
					{
						Highlight()
						return true
					}

					s_autoSolveData.anythingChanged = true
				}
				else
				{
					Highlight(["row" + s_autoSolveData.solveIndex], "red")
					s_autoSolveData.skip.rows[s_autoSolveData.solveIndex] = true
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
				Highlight()
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
			EnableButtons()
			s_autoSolveData = null
		}
		else if (s_completeness.total < (s_clues.rows.length + s_clues.cols.length))
		{
			setTimeout(SolveFail, 200)
		}
		else
		{
			setTimeout(SolveDone, 1)
		}
	}
	else
	{
		setTimeout(SolveStep, 1)
	}
}

function SolveDone()
{
	s_completeness.done = true
	EnableButtons()
	s_autoSolveData = null
}

function SolveFail()
{
	EnableButtons()
	alert("Failed to solve puzzle!")
	s_autoSolveData = null
}

function CombineSolve(combineHere, startWith, alreadyContains)
{
	var paddedWithDots = startWith.padEnd(alreadyContains.length, ".")

	for (var checkMatch in alreadyContains)
	{
		const chr = alreadyContains[checkMatch]
		if (! (chr == ' ' || chr == paddedWithDots[checkMatch]))
		{
			return false
		}
	}
	
	if (combineHere.length)
	{
		for (var combine in paddedWithDots)
		{
			if (combineHere[combine] != paddedWithDots[combine])
			{
				combineHere[combine] = ' '
			}
		}
	}
	else
	{
		for (var chr of paddedWithDots)
		{
			combineHere.push(chr)
		}
	}
}

function TryToSolveSection(combineHere, startWith, clues, fromClueIndex, alreadyContains)
{
	if (fromClueIndex >= clues.length)
	{
		return CombineSolve(combineHere, startWith, alreadyContains)
	}

	var buildPotential = startWith

	if (buildPotential != "")
	{
		if (alreadyContains[buildPotential.length] == '1')
		{
			return
		}
		buildPotential += '.'
	}
	
	const thisClue = clues[fromClueIndex]
	const thisClueTxt = "".padEnd(thisClue, "1")

	while (buildPotential.length <= alreadyContains.length - thisClue)
	{
		const len = buildPotential.length
		
		var bCheckIt = (len == 0 || alreadyContains[len - 1] != '1')
		
		for (var t = 0; bCheckIt && t < thisClue; ++ t)
		{
			if (alreadyContains[len + t] == '.')
			{
				bCheckIt = false
			}
		}
		
		if (bCheckIt)
		{
			TryToSolveSection(combineHere, buildPotential + thisClueTxt, clues, fromClueIndex + 1, alreadyContains)
		}

		if (alreadyContains[len] == '1')
		{
			return
		}
		buildPotential += "."
	}
}

function TryToSolve(alreadyContains, clues)
{
	var combineHere = []
	TryToSolveSection(combineHere, "", clues, 0, alreadyContains)

	var was = alreadyContains.join('')
	var isNow = combineHere.join('')

	return (was != isNow) ? combineHere : null
}
