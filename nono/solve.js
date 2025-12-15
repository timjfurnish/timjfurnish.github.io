var s_autoSolveData = null

const kEnableCheckForDupes = true

function SolveStart(stopAfterSingleHint)
{
	s_autoSolveData = {solveColumns: true, solveIndex: 0, anythingChanged: true, skip: {cols: {}, rows: {}}, stopAfterSingleHint:stopAfterSingleHint}
	s_autoSolveData.dupeInto = {cols: CheckForDupes(s_clues.cols), rows: CheckForDupes(s_clues.rows)}
	
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

function CheckForDupes(cluesIn)
{
	var joined = []
	var reply = []

	cluesIn.forEach(data => joined.push(data.join(' ')))
//	console.log("JOINED: [" + joined + "]");

	for (var i = 0; i < joined.length; ++i)
	{
		var matchFound = 0
//		console.log("Do any clues from " + (i + 1) + " onwards match " + i + " [" + joined[i] + "]")

		if (kEnableCheckForDupes)
		{
			for (var copyTo = i + 1; copyTo < joined.length; ++ copyTo)
			{
				if (joined[i] == joined[copyTo])
				{
	//				console.log("Match found! Index " + i + " and index " + copyTo + " are both [" + joined[i] + "]")
					matchFound = copyTo
					break
				}
			}
		}

		reply.push(matchFound)
	}

	return reply
}

function ArraysMatch(a, b)
{
	for (var n in a)
	{
		if (a[n] != b[n])
		{
			return false
		}
	}

	return true
}

function SolveForDesigner(grid, solveColumns)
{
	var skip = {cols:{}, rows:{}}
	var dupeInto = {}
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

	dupeInto.cols = CheckForDupes(clues.cols)
	dupeInto.rows = CheckForDupes(clues.rows)

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
		const getRowOrColumnFunc = solveColumns ? GetColumnFromGrid : GetRowFromGrid
		const skipArray = skip[colsOrRows]
	
		if (! skipArray[solveIndex] && !completeness[colsOrRows][solveIndex])
		{
			const already = getRowOrColumnFunc(solveHere, solveIndex)
			var bCompleteNow = !already.includes(' ')
			
			if (bCompleteNow)
			{
				skipArray[solveIndex] = true
			}
			else
			{
				const newData = TryToSolve(already, clues[colsOrRows][solveIndex])
				var writeToIndex = solveIndex

				skipArray[solveIndex] = true

				do
				{
					if (writeToIndex == solveIndex || ArraysMatch(already, getRowOrColumnFunc(solveHere, writeToIndex)))
					{
						if (newData)
						{
							for (var i = 0; i < newData.length; ++ i)
							{
								if (solveColumns)
								{
									if (solveHere[i][writeToIndex] != newData[i])
									{
										delete skip.rows[i]
										solveHere[i][writeToIndex] = newData[i]
									}
								}
								else
								{
									if (solveHere[writeToIndex][i] != newData[i])
									{
										delete skip.cols[i]
										solveHere[writeToIndex][i] = newData[i]
									}
								}
							}
						}
					}

					writeToIndex = dupeInto[colsOrRows][writeToIndex]
				}
				while (writeToIndex)

				if (newData)
				{
					bCompleteNow = !newData.includes(' ')
					anythingChanged = true
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
			else
			{
				++ count
			}
		}
		
		++ solveIndex

		if (solveIndex >= sizes[colsOrRows])
		{
			solveColumns = !solveColumns
			solveIndex = 0
			
			if (! anythingChanged)
			{
				return solveHere
			}
			
			anythingChanged = false
		}
	}
}

function Hint()
{
	var bDidSomething = false
	
	while (!bDidSomething)
	{
		const colsOrRows = s_autoSolveData.solveColumns ? "cols" : "rows"

		if (! s_autoSolveData.skip[colsOrRows][s_autoSolveData.solveIndex] && !s_completeness[colsOrRows][s_autoSolveData.solveIndex])
		{
			const skipColsOrRows = s_autoSolveData.solveColumns ? "rows" : "cols"
			const getRowOrColumnFunc = s_autoSolveData.solveColumns ? GetColumnFromGrid : GetRowFromGrid
			const alreadyGot = getRowOrColumnFunc(s_activePuzzleSolutionSoFar, s_autoSolveData.solveIndex)
			const newData = TryToSolve(alreadyGot, s_clues[colsOrRows][s_autoSolveData.solveIndex])
			var writeToIndex = s_autoSolveData.solveIndex
			const highlightThese = []

			do
			{
				if (writeToIndex == s_autoSolveData.solveIndex || ArraysMatch(alreadyGot, getRowOrColumnFunc(s_activePuzzleSolutionSoFar, writeToIndex)))
				{
					if (newData)
					{
						for (var i = 0; i < newData.length; ++ i)
						{
							if (s_autoSolveData.solveColumns ? SetCell(writeToIndex, i, newData[i]) : SetCell(i, writeToIndex, newData[i]))
							{
								delete s_autoSolveData.skip[skipColsOrRows][i]
							}
						}
					}

					highlightThese.push(colsOrRows + writeToIndex)
					s_autoSolveData.skip[colsOrRows][writeToIndex] = true
				}

				writeToIndex = s_autoSolveData.dupeInto[colsOrRows][writeToIndex]
			}
			while (writeToIndex)

			if (newData)
			{
				if (s_autoSolveData.stopAfterSingleHint)
				{
					Highlight()
					return true
				}
					
				Highlight(highlightThese, "#66FF66")
				s_autoSolveData.anythingChanged = true
			}
			else
			{
				Highlight(highlightThese, "red")
			}

			bDidSomething = true
		}

		++ s_autoSolveData.solveIndex
		
		if (s_autoSolveData.solveIndex >= s_clues[colsOrRows].length)
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

function CombineSolve(combineHere, paddedWithDots, alreadyContains)
{
	for (var checkMatch in alreadyContains)
	{
		const chr = alreadyContains[checkMatch]
		if (chr != ' ' && chr != paddedWithDots[checkMatch])
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
	const remainingClues = clues.length - fromClueIndex
	
	if (remainingClues <= 0)
	{
		return CombineSolve(combineHere, startWith.padEnd(alreadyContains.length, "."), alreadyContains)
	}

	if (startWith.length >= alreadyContains.length - (remainingClues * 2 - 1))
	{
		return
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

	// Return combineHere if there are any changes
	return ArraysMatch(alreadyContains, combineHere) ? null : combineHere
}
