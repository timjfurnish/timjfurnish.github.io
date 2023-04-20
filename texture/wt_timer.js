let s_timerActive = false
let s_timerOffset = 0
let s_wtTimerStoppedAt = null

function WTTimerNow()
{
	return (s_wtTimerStoppedAt === null) ? performance.now() : s_wtTimerStoppedAt
}

function WTTimerStart(old)
{
	const clock = WTTimerNow()

	s_timerOffset = clock - old
	s_timerActive = true

	WTDebug("WTTimerStart: starting timer (clock=" + clock + ", previousTime=" + old + ", offset=" + s_timerOffset + ")")
}

function WTTimerLoad()
{
	const stored = WTStorage_GetValue('time')
	if (stored === null)
	{
		WTDebug("WTTimerLoad: no time stored")
	}
	else
	{
		const parsed = parseFloat(stored)
		WTDebug("WTTimerLoad: time stored is '" + stored + "' i.e. " + parsed)
		WTTimerStart(parsed)
	}
}

function WTTimerSave()
{
	if (s_timerActive)
	{
		const timeNow = WTTimerNow()
		const timeTotal = timeNow - s_timerOffset
		WTStorage_WriteValue('time', timeTotal)
	}
}

function WTTimerStop()
{
	if (s_wtTimerStoppedAt === null)
	{
		s_wtTimerStoppedAt = performance.now()

		if (s_timerActive)
		{
			WTDebug("Stopping timer! Total time: " + WTTimerGetAsString())
		}
		else
		{
			WTDebug("Stopping timer but timer is inactive")
		}
	}
	else
	{
		WTDebug("Timer is already stopped")
	}
}

function WTTimerGetAsString()
{
	let builder = new Array()

	if (s_timerActive)
	{
		const timeNow = WTTimerNow()
		let timeSeconds = Math.floor((timeNow - s_timerOffset) / 1000)
		let timeMins = Math.floor(timeSeconds / 60)
		timeSeconds -= timeMins * 60
		let timeHours = Math.floor(timeMins / 60)
		timeMins -= timeHours * 60
	
		if (timeHours)
		{
			builder.push(timeHours + ((timeHours == 1) ? " hour" : " hours"))
		}

		if (timeMins)
		{
			builder.push(timeMins + ((timeMins == 1) ? " minute" : " minutes"))
		}

		if (timeSeconds)
		{
			builder.push(timeSeconds + ((timeSeconds == 1) ? " second" : " seconds"))
		}
	}
	
	return builder.join(', ')
}