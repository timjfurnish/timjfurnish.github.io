//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_graphClickData

function Smoother(arr)
{
	var total = 0
	var t = 0

	const len = arr.length
	const midIndex = (len + 1) / 2
	const div = midIndex * midIndex

	for (var val of arr)
	{
		if (val)
		{
			const frac = (+t + 1) * (len - t) / (div)
			total += val * frac * frac
		}

		++ t
	}

	return total
}

function GetGraphSmoothingValueName()
{
	const {page} = g_currentOptions[g_selectedTabName]
	return page ? "smoothing_" + page : "smoothing"
}

function GraphCreateStandardOptions(options, graphFuncName, addColourUsing)
{
	OptionsMakeNumberBox(options, graphFuncName, "Smoothing", GetGraphSmoothingValueName(), 5)

	if (addColourUsing)
	{
		var nameData = {[""]:""}

		for (var eachCol of Object.keys(g_metaDataAvailableColumns))
		{
			nameData[eachCol] = eachCol
		}

		OptionsMakeSelect(options, graphFuncName + "()", "Colour background using", "colourUsing", nameData, "", true)
	}
}

function CreateDrawData(drawData, smoothingCount, colourEntries, data)
{
	for (var spelling of colourEntries)
	{
		drawData[spelling] = {smoothing:[0], drawThis:[]}
		for (var i = 0; i < smoothingCount; ++ i)
		{
			drawData[spelling].smoothing.push(0, 0)
		}
	}

	//================================================
	// Calculate largest value and fill in drawData
	//================================================

	var biggestVal = 0.01

	for (var t of data)
	{
		var totalHere = 0

		for (var spelling of colourEntries)
		{
			const incomingValue = t?.[spelling] ?? 0
			const {smoothing, drawThis} = drawData[spelling]
			smoothing.push(incomingValue)
			smoothing.shift()
			totalHere += Smoother(smoothing)
			drawThis.push(totalHere)
		}

		if (biggestVal < totalHere)
		{
			biggestVal = totalHere
		}
	}

	for (var i = 0; i < smoothingCount * 2; ++ i)
	{
		var totalHere = 0

		for (var spelling of colourEntries)
		{
			const {smoothing, drawThis} = drawData[spelling]
			smoothing.push(0)
			smoothing.shift()
			totalHere += Smoother(smoothing)
			drawThis.push(totalHere)
		}

		if (biggestVal < totalHere)
		{
			biggestVal = totalHere
		}
	}

	colourEntries.reverse()
	
	return biggestVal
}

function GraphAddBackgroundBlock({backgroundBlocks}, count, colourID)
{
	if (backgroundBlocks)
	{
		const {length} = backgroundBlocks

		if (length)
		{
			var last = backgroundBlocks[length - 1]

			if (last.colourID == colourID)
			{
				last.width += count
				return
			}
		}
		
		backgroundBlocks.push({width:count, colourID:colourID})
	}
}

function CreateGraphBackgroundColours(graphData)
{
	const colourIDs = {}
	const {backgroundBlocks} = graphData

	for (var elem of backgroundBlocks)
	{
		if (elem.colourID !== undefined)
		{
			colourIDs[elem.colourID] = true
		}
	}
	
	graphData.bgColours = MakeColourLookUpTable(Object.keys(colourIDs), 0.4, undefined, 0.6)
}

function DrawSmoothedGraph(graphData)
{
	const canvas = document.getElementById("graphCanvas")
	const drawToHere = canvas?.getContext("2d")

	if (drawToHere)
	{
		const {colours, data, backgroundBlocks, doStripes} = graphData
		const smoothingValueName = GetGraphSmoothingValueName()
		const smoothingCountRaw = +g_currentOptions[g_selectedTabName][smoothingValueName]
		const smoothingCount = (smoothingCountRaw * (smoothingCountRaw + 1)) / 2
		const colourEntries = Object.keys(colours)
		const drawData = {}
		const sizeX = data.length
		const {width, height} = canvas

		NovaLog("Drawing graph (canvas=" + width + " data=" + sizeX + ") for " + colourEntries.length + " values [" + colourEntries.join(', ') + "] " + g_selectedTabName + "." + smoothingValueName + "=" + smoothingCountRaw + " (" + typeof smoothingCountRaw + ") smooth=" + smoothingCount)

		const biggestVal = CreateDrawData(drawData, smoothingCount, colourEntries, data)

		//=========================================
		// DONE GATHERING DATA! DRAW IT!
		//=========================================

		drawToHere.fillStyle = "#444444"
		drawToHere.fillRect(0, 0, width, height)
		
		const drawText = []

		if (backgroundBlocks)
		{
			if (! graphData.bgColours)
			{
				CreateGraphBackgroundColours(graphData)
			}
			
			var countParagraphs = 0
			var lastX = 0
			const multiplier = width / sizeX

			for (var elem of backgroundBlocks)
			{
				countParagraphs += elem.width

				const x = Math.floor(countParagraphs * multiplier)
				const colour = graphData.bgColours[elem.colourID]
				
				if (colour && lastX != x)
				{
					drawToHere.beginPath()
					drawToHere.rect(lastX, 0, x - lastX + 1, height)
					drawToHere.fillStyle = colour
					drawToHere.fill()
					
					if (elem.width * multiplier > 12)
					{
						drawText.push({drawAtX:lastX, drawThisText:elem.colourID.toUpperCase()})
					}
				}

				lastX = x
			}

			if (countParagraphs != sizeX)
			{
				NovaWarn("Counted " + countParagraphs + " paragraphs when drawing background blocks but sizeX is " + sizeX)
			}
		}

		const scaleY = height * 0.95 / biggestVal
		
		if (doStripes)
		{
			var verticalBarY = height
			
			while (verticalBarY >= 0)
			{
				drawToHere.beginPath()
				verticalBarY -= scaleY * 2
				drawToHere.rect(0, verticalBarY, width, scaleY)
				drawToHere.fillStyle = "#00000028"
				drawToHere.fill()
			}
		}

		for (var spelling of colourEntries)
		{
			const {drawThis} = drawData[spelling]

			if (smoothingCount > 1)
			{
				// Remove the first smoothingCount - 1 entries and the last smoothingCount entries so that we end up the same size as the data passed in
				drawThis.splice(0, smoothingCount - 1)
				drawThis.splice(1 - smoothingCount)
			}

			if (drawThis.length > 1)
			{
				var numDone = 0
				const scaleX = width / (drawThis.length - 1)
				drawToHere.fillStyle = colours[spelling]
				drawToHere.beginPath()
				drawToHere.moveTo(0, height)

				for (var t of drawThis)
				{
					drawToHere.lineTo(numDone * scaleX, height - t * scaleY)
					++ numDone
				}

				drawToHere.lineTo(width, height)
				drawToHere.fill()
			}
		}
		
		// Move this
		if (drawText.length)
		{
			drawToHere.font = "12px sans-serif"
			drawToHere.textBaseline = "top"
			drawToHere.textAlign = "right"
			
			for (const {drawAtX, drawThisText} of drawText)
			{
				drawToHere.save()
				drawToHere.translate(drawAtX, 0)
				drawToHere.rotate(-Math.PI/2)
				drawToHere.fillStyle = "#00000080"
				drawToHere.fillText(drawThisText, -4, 2, height - 6)
				drawToHere.fillStyle = "#FFFFFF"
				drawToHere.fillText(drawThisText, -3, 1, height - 6)
				drawToHere.restore()
			}
		}

		g_graphClickData = graphData.clickData

		if (g_graphClickData)
		{
			for (var clickElement of g_graphClickData.clickList)
			{
				clickElement.offsetX = width * (clickElement.clickX + 0.5) / sizeX
			}
		}
	}
}

function CalcGraphCanvasWidth()
{
	return Math.max(Math.floor(window.innerWidth * 0.825), 200)
}

function GraphClick({offsetX})
{
	if (g_graphClickData)
	{
		var closest = undefined
		var closestDistance = window.innerWidth
		
		for (var clickable of g_graphClickData.clickList)
		{
			const myDistance = Math.abs(clickable.offsetX - offsetX)
			if (myDistance < closestDistance)
			{
				closestDistance = myDistance
				closest = clickable.elemName
			}
		}
		
		if (closest)
		{
			ScrollToElementId(closest)
			TrySetElementClass(closest, "highlighter", true)
			ExecuteAfterTime(() => TrySetElementClass(closest, "highlighter", false), 1000, g_graphClickData.timerCancelWhen)
		}
	}
}

function GraphAddCanvas(reply, height, thenCall, visible)
{
	reply.push('<DIV ID="graphShowHide" STYLE="display:' + (visible ? 'block' : 'none') + '"><BR><CANVAS WIDTH="' + CalcGraphCanvasWidth() + '" HEIGHT="' + height + '" ID="graphCanvas"></CANVAS></DIV>')

	thenCall.push(function ()
	{
		document.getElementById("graphCanvas").onmousedown = GraphClick
	})
}

window.addEventListener('resize', function(theEvent)
{
	const elem = document.getElementById("graphCanvas")

	if (elem)
	{
		const newWidth = CalcGraphCanvasWidth()

		if (newWidth != elem.width)
		{
			elem.width = newWidth
			TabRedrawGraph()
		}
	}
}, true);
