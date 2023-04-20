function WTStorage_ReadHistory()
{
	let historyStr = window.localStorage.getItem(s_wtSettings.storagePrefix + "history")
	
	if (!historyStr && s_wtSettings.storagePrefix == 'flywheel_')
	{
		// Legacy - save game for The Flywheel written before we had storagePrefix
		historyStr = window.localStorage.getItem("history")
		
		if (historyStr)
		{
			WTDebug("Found legacy save game stuff stored as just 'history' so resaving it as '" + s_wtSettings.storagePrefix + "history'")
			window.localStorage.removeItem('history')
			window.localStorage.setItem(s_wtSettings.storagePrefix + 'history', historyStr)
		}
	}

	if (historyStr)
	{
		let history = historyStr.split(",")
		WTDebug("Read history from local storage (length=" + history.length + ")")
		return history
	}

	WTDebug("Found no history in local storage")
	return null
}

function WTStorage_WriteHistory(history)
{
//	WTDebug("Writing history (length=" + history.length + ")")
	window.localStorage.setItem(s_wtSettings.storagePrefix + 'history', history.join(','))	
}

function WTStorage_Clear()
{
	window.localStorage.removeItem(s_wtSettings.storagePrefix + 'history')
	window.localStorage.removeItem(s_wtSettings.storagePrefix + 'progress')
}

function WTStorage_WriteValue(key, val)
{
//	WTDebug("Writing " + key + "='" + val + "'")
	window.localStorage.setItem(s_wtSettings.storagePrefix + key, val)	
}

function WTStorage_GetValue(key)
{
	let val = window.localStorage.getItem(s_wtSettings.storagePrefix + key)	
	WTDebug("Reading " + key + "='" + val + "'")
	return val
}