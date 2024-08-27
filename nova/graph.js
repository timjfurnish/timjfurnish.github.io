//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

function Smoother(arr)
{
	var total = 0

	const len = arr.length
	const midIndex = (len + 1) / 2
	const div = midIndex * midIndex

	for (var t in arr)
	{
		const frac = (+t + 1) * (len - t) / (div)
		total += arr[t] * frac * frac
	}

	return total
}

function GraphCreateStandardOptions(options, graphFuncName, addColourUsing)
{
	OptionsMakeNumberBox(options, graphFuncName, "Smoothing", "smoothing", 30)
	
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

function DrawSmoothedGraph(graphData, smoothingCount, backgroundData)
{
	const {colours, data} = graphData

	// WORK OUT WHAT TO DRAW
	const colourEntries = Object.keys(colours)
	const drawData = {}
	const sizeX = data.length

//	NovaLog("Drawing graph of width " + sizeX + " for " + colourEntries.length + " values [" + colourEntries.join(', ') + "] smoothing=" + smoothingCount)

	var biggestVal = 0
	
	for (var spelling of colourEntries)
	{
		drawData[spelling] = {smoothing:[0], drawThis:[]}

		for (var i = 0; i < smoothingCount; ++ i)
		{
			drawData[spelling].smoothing.push(0, 0)
		}
	}

	const sanityCheckTotalData = {}
	
	for (var t of data)
	{
		var totalHere = 0
		
		for (var spelling of colourEntries)
		{
			const incomingValue = t?.[spelling] ?? 0
			drawData[spelling].smoothing.push(incomingValue)				
			drawData[spelling].smoothing.shift()

			Tally(sanityCheckTotalData, spelling, incomingValue)

			const myVal = Smoother(drawData[spelling].smoothing)
			totalHere += myVal

			drawData[spelling].drawThis.push(totalHere)
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
			drawData[spelling].smoothing.push(0)
			drawData[spelling].smoothing.shift()

			const myVal = Smoother(drawData[spelling].smoothing)
			totalHere += myVal

			drawData[spelling].drawThis.push(totalHere)
		}
		
		if (biggestVal < totalHere)
		{
			biggestVal = totalHere
		}
	}

	colourEntries.reverse()

	// DONE GATHERING DATA! DRAW IT!
	
	const canvas = document.getElementById("graphCanvas")
	const drawToHere = canvas?.getContext("2d")
	
	if (drawToHere)
	{
		drawToHere.fillStyle = "#444444"
		drawToHere.fillRect(0, 0, canvas.width, canvas.height)
		
		const colourUsing = backgroundData?.colourUsing

		if (colourUsing)
		{
			if (colourUsing in g_metaDataSeenValues)
			{
				const colours = MakeColourLookUpTable(Object.keys(g_metaDataSeenValues[colourUsing]), 0.4, undefined, backgroundData.brightness)

				var countParagraphs = 0
				var lastX = 0

				// TO DO: get this via backgroundData
				for (var elem of g_metaDataInOrder)
				{
					countParagraphs += elem.Paragraphs
					const x = (countParagraphs / sizeX) * canvas.width

					drawToHere.beginPath()
					drawToHere.fillStyle = colours[elem.info[colourUsing]] ?? "#666666"
					drawToHere.rect(lastX, 0, x - lastX + 1, canvas.height)
					drawToHere.fill()
					lastX = x
				}
				
				if (countParagraphs != sizeX)
				{
					NovaWarn("Counted " + countParagraphs + " paragraphs when drawing background but sizeX is " + sizeX)
				}
			}
			else
			{
				NovaWarn("colourUsing='" + colourUsing + "' which isn't in [" + Object.keys(g_metaDataSeenValues) + "]")
			}
		}
		
		for (var spelling of colourEntries)
		{
			const {drawThis} = drawData[spelling]

			// Remove the first smoothingCount entries and the last smoothingCount entries so that we end up the same size as the data passed in
			drawThis.splice(0, smoothingCount)
			drawThis.splice(-smoothingCount)

			var numDone = 0
			const scaleX = canvas.width / (drawThis.length + 1)
			const scaleY = canvas.height * 0.95 / biggestVal

			drawToHere.fillStyle = colours[spelling]
			drawToHere.beginPath()
			drawToHere.moveTo(0, canvas.height)
		
			for (var t of drawThis)
			{
				++ numDone
				drawToHere.lineTo(numDone * scaleX, canvas.height - t * scaleY)
			}

			drawToHere.lineTo(canvas.width, canvas.height)
			drawToHere.fill()
		}
	}	
}

function CalcGraphCanvasWidth()
{
	return Math.max(window.innerWidth - 125, 870)
}

window.addEventListener('resize', function(theEvent)
{
	const elem = document.getElementById("graphCanvas")
	
	if (elem)
	{
		elem.width = CalcGraphCanvasWidth()
		TabRedrawGraph()
	}
}, true);
