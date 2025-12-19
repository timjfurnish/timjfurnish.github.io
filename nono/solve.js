var s_autoSolveData = null

const kEnableCheckForDupes = true

function SolveStart(stopAfterSinglePass)
{
	s_autoSolveData = {solveColumns: true, solveIndex: 0, anythingChanged: true, skip: {cols: {}, rows: {}}, stopAfterSinglePass:stopAfterSinglePass}
	s_autoSolveData.dupeInto = {cols: CheckForDupes(s_clues.cols), rows: CheckForDupes(s_clues.rows)}
	
	delete s_lastSetup.paint

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

function FillInSolution(newData, numbers)
{
	if (s_autoSolveData.calcBest)
	{
		const myScore = newData.canFill / newData.num
		
		if (! s_autoSolveData.calcBest.numPossibilities || (myScore > s_autoSolveData.calcBest.myScore))
		{
			s_autoSolveData.calcBest.myScore = myScore
			s_autoSolveData.calcBest.numbers = numbers
			s_autoSolveData.calcBest.bIsColumn = s_autoSolveData.solveColumns
			s_autoSolveData.calcBest.numPossibilities = newData
		}
	}
	else
	{
		const skipColsOrRows = s_autoSolveData.solveColumns ? "rows" : "cols"

		for (var writeToIndex of numbers)
		{
			for (var i = 0; i < newData.length; ++ i)
			{
				if (s_autoSolveData.solveColumns ? SetCell(writeToIndex, i, newData[i]) : SetCell(i, writeToIndex, newData[i]))
				{
					delete s_autoSolveData.skip[skipColsOrRows][i]
				}
			}
		}
	}	
}

function Hint()
{
	var bDone = undefined

	while (!bDone)
	{
		const colsOrRows = s_autoSolveData.solveColumns ? "cols" : "rows"

		if (! s_autoSolveData.skip[colsOrRows][s_autoSolveData.solveIndex] && !s_completeness[colsOrRows][s_autoSolveData.solveIndex])
		{
			const getRowOrColumnFunc = s_autoSolveData.solveColumns ? GetColumnFromGrid : GetRowFromGrid
			const alreadyGot = getRowOrColumnFunc(s_activePuzzleSolutionSoFar, s_autoSolveData.solveIndex)
			const newData = TryToSolve(alreadyGot, s_clues[colsOrRows][s_autoSolveData.solveIndex])
			var writeToIndex = s_autoSolveData.solveIndex
			const highlightThese = []
			const numbers = []

			do
			{
				if (writeToIndex == s_autoSolveData.solveIndex || ArraysMatch(alreadyGot, getRowOrColumnFunc(s_activePuzzleSolutionSoFar, writeToIndex)))
				{
					numbers.unshift(writeToIndex)
					highlightThese.push(colsOrRows + writeToIndex)
					s_autoSolveData.skip[colsOrRows][writeToIndex] = true
				}
			
				writeToIndex = s_autoSolveData.dupeInto[colsOrRows][writeToIndex]
			}
			while (writeToIndex)

			if (newData)
			{
				FillInSolution(newData, numbers)
				Highlight(highlightThese, "#66FF66")
				s_autoSolveData.anythingChanged = true
			}
			else
			{
				Highlight(highlightThese, "red")
			}

			bDone = "CONTINUE"
		}

		++ s_autoSolveData.solveIndex
		
		if (s_autoSolveData.solveIndex >= s_clues[colsOrRows].length)
		{
//			console.log("Finished trying to solve " + (s_autoSolveData.solveColumns ? "columns" : "rows") + "; skip.cols=" + Object.keys(s_autoSolveData.skip.cols) + " skip.rows=" + Object.keys(s_autoSolveData.skip.rows))

			s_autoSolveData.solveColumns = !s_autoSolveData.solveColumns
			s_autoSolveData.solveIndex = 0
			
			if (s_autoSolveData.stopAfterSinglePass && ! -- s_autoSolveData.stopAfterSinglePass)
			{
				bDone = "PASS_DONE"
			}
			else if (! s_autoSolveData.anythingChanged)
			{
				bDone = "NO_CHANGES"
			}
			
			s_autoSolveData.anythingChanged = false
		}
	}
	
	return bDone
}

function SolveStep()
{
	const hintReply = Hint()
	
	if (hintReply == "CONTINUE")
	{
		setTimeout(SolveStep, 1)
	}
	else if (hintReply == "PASS_DONE")
	{
		Highlight()
		EnableButtons()
		s_autoSolveData = null
	}
	else if (s_completeness.total < (s_clues.rows.length + s_clues.cols.length))
	{
		Highlight()
		setTimeout(SolveFail, 200)
	}
	else
	{
		Highlight()
		setTimeout(SolveDone, 1)
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

function CombineSolve(solveWorkspace, paddedWithDots)
{
	const {alreadyContains, combineHere} = solveWorkspace

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
	
	++ solveWorkspace.numPossibilities
}

function TryToSolveSection(solveWorkspace, startWith, fromClueIndex)
{
	const {clues, alreadyContains} = solveWorkspace
	const remainingClues = clues.length - fromClueIndex
	
	if (remainingClues <= 0)
	{
		return CombineSolve(solveWorkspace, startWith.padEnd(alreadyContains.length, "."))
	}

	if (startWith.length > alreadyContains.length - (remainingClues * 2 - 1))
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
			TryToSolveSection(solveWorkspace, buildPotential + thisClueTxt, fromClueIndex + 1)
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
	const solveWorkspace = {combineHere:[], clues:clues, alreadyContains:alreadyContains, numPossibilities:0}
	TryToSolveSection(solveWorkspace, "", 0)

	// Return null if there are no changes
	if (ArraysMatch(alreadyContains, solveWorkspace.combineHere))
	{
		return null
	}

	if (s_autoSolveData.calcBest)
	{
		var canFill = 0

		for (var n in alreadyContains)
		{
			if (alreadyContains[n] != solveWorkspace.combineHere[n])
			{
				++ canFill
			}
		}

		return {num:solveWorkspace.numPossibilities, canFill:canFill}
	}

	return solveWorkspace.combineHere
}

function SmartHint()
{
	// First pick the row/column with the fewest possibilities
	
	s_autoSolveData = {solveColumns: true, solveIndex: 0, anythingChanged: true, skip: {cols: {}, rows: {}}, stopAfterSinglePass:2, calcBest:{}}
	s_autoSolveData.dupeInto = {cols: CheckForDupes(s_clues.cols), rows: CheckForDupes(s_clues.rows)}

	delete s_lastSetup.paint

	DisableButtonsIn("buttonsGoHere")
	setTimeout(TickSmartHintPhase1, 1)
}

function TickSmartHintPhase1()
{
	if (Hint() == "PASS_DONE")
	{
		if (s_autoSolveData.calcBest.numPossibilities)
		{
			var numberList = ""
			var joiner = " and "
			var colOrRow = (s_autoSolveData.calcBest.bIsColumn ? "column" : "row")
			var thisOrThese = "this "
			var highlightMe = []

			for (var eachNumber of s_autoSolveData.calcBest.numbers)
			{
				highlightMe.push((s_autoSolveData.calcBest.bIsColumn ? "cols" : "rows") + eachNumber)

				if (numberList != "")
				{
					numberList = (eachNumber + 1) + joiner + numberList

					if (joiner != ", ")
					{
						colOrRow += "s"
						thisOrThese = "each of these "
						joiner = ", "
					}
				}
				else
				{
					numberList = (eachNumber + 1)
				}
			}

			Highlight(highlightMe, "#FFFFFF")
			
			var output = ['<P id=results style="margin-top: 40vh">']

			if (s_autoSolveData.calcBest.numPossibilities.num == 1)
			{
				output.push("There's only one way to complete " + colOrRow + " " + numberList + "...")
				output.push("<BR><SMALL>You can finish " + thisOrThese + colOrRow + "!")
			}
			else
			{
				output.push("There are " + s_autoSolveData.calcBest.numPossibilities.num + " ways to complete " + colOrRow + " " + numberList + "...")
				output.push("<BR><SMALL>You can fill in " + s_autoSolveData.calcBest.numPossibilities.canFill + " cells in " + thisOrThese + colOrRow + "!")
			}

			output.push("</P>")
			
			PopUp(output.join(''), BuildButtons({["TELL ME MORE"]:"SmartHintTellMeMore()"}, "biggy") + "<BR>" + BuildButtons({["DO IT FOR ME"]:"CloseCongrats()", ["CLOSE"]:"CloseCongrats()"}))
		}
		else
		{
			Highlight()
		}
		
		s_autoSolveData = null
		EnableButtons()
	}
	else
	{
		setTimeout(TickSmartHintPhase1, 1)
	}
}

function SmartHintTellMeMore()
{
	PopUp('<P id=results style="margin-top: 40vh">Here\'s more info</P>', BuildButtons({["DO IT FOR ME"]:"CloseCongrats()", ["CLOSE"]:"CloseCongrats()"}))
}

function PopUp(content, buttons)
{
	const elemTop = GetElement("popUpTop")
	const elemBack = GetElement("popUpBack")
	
	elemTop.innerHTML = content + "<P>" + buttons + "</P>"
	elemBack.innerHTML = content

	for (var each of [elemTop, elemBack])
	{
		each.style.display = "block"
		each.style.pointerEvents = "auto"
		each.style.transitionDuration = "0.8s"
	}

	setTimeout(() => {
		for (var each of [elemTop, elemBack])
		{
			each.style.opacity = 1
			each.removeEventListener("transitionend", OnTransitionDone)
		}
	}, 0)
}