var g_fadeMe, g_trig, g_stillGoing, g_fadeInElementNames, g_fadeSpeed, g_tickTimerID, g_nextTimerID

function FadeReset()
{
	if (g_tickTimerID)
	{
		clearTimeout(g_tickTimerID)
		g_tickTimerID = undefined
	}

	if (g_nextTimerID)
	{
		clearTimeout(g_nextTimerID)
		g_nextTimerID = undefined
	}
	
	g_fadeMe = 0
	g_trig = {}
	g_stillGoing = false
	g_fadeInElementNames = []
}

FadeReset()

function BuildText(text, tags)
{
	for (var t of tags.split('|'))
	{
		text = "<" + t + ">" + text + "</" + (t.split(' ', 1)[0]) + ">"
	}
	return text
}

function QueueFade(elementName)
{
	g_fadeInElementNames.push(elementName)
	return elementName
}

function FadeGetNextName()
{
	return QueueFade('fadeMe' + (g_fadeMe ++))
}

function StartFading(fadeSpeed, delay)
{
	FadeStartNext()
	g_tickTimerID = setTimeout(TickFade, delay ?? 0)
	g_fadeSpeed = fadeSpeed
	g_stillGoing = true
}

function FadeStartNext()
{
	g_nextTimerID = undefined

	const name = g_fadeInElementNames.shift()

	if (name)
	{
		const elem = document.getElementById(name)
		const rect = elem.getBoundingClientRect()

		g_trig[name] = {style:elem.style, op:0}
		
		// Speed up if this element is off the top of the screen...
		const time = (-rect.y >= rect.height) ? 2 : g_fadeSpeed
		g_nextTimerID = setTimeout(FadeStartNext, time)
	}
	else
	{
		g_stillGoing = false
	}
}

function TickFade()
{
	g_tickTimerID = undefined

	var didSomething = g_stillGoing

	for (var [k,v] of Object.entries(g_trig))
	{
		v.op += 0.015
		if (v.op >= 1)
		{
			v.style.opacity = 1
			delete g_trig[k]
		}
		else
		{
			v.style.opacity = v.op
			didSomething = true
		}
	}
	
	if (didSomething)
	{
		g_tickTimerID = setTimeout(TickFade, 20)
	}
}
