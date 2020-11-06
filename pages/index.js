import { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
const AZ_INDEX = 3
const GA_INDEX = 10
const NV_INDEX = 33
const PA_INDEX = 38
const STATE_INDEXES = [AZ_INDEX, GA_INDEX, NV_INDEX, PA_INDEX]
let fetchyTimestamp, timestamp
const reeeeee = {
  3: 0,
  10: 0,
  33: 0,
  38: 0
}
let intervalHold
export default function Home () {
  useEffect(() => {
    let restored = window.localStorage.getItem('whosleadingbackup') || '{}'
    restored = JSON.parse(restored)
    if (restored && restored?.timestamp) {
      setResults(restored.rows)
      timestamp = restored.timestamp
      fetchyTimestamp = restored.lastFetchTimestamp
      setNewBatchTimestamp(restored.timestamp)
      setLastFetchTimestamp(restored.lastFetchTimestamp)
    }

    if (Date.now() - fetchyTimestamp > 60000 || !fetchyTimestamp) {
      fetchy()
    }

    if (intervalHold) clearInterval(intervalHold)
    intervalHold = setInterval(() => fetchy(), 60000)

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        if (Date.now() - fetchyTimestamp > 60000) {
          fetchy()
        }
        if (intervalHold) clearInterval(intervalHold)
        intervalHold = setInterval(() => fetchy(), 60000)
      } else {
        if (intervalHold) clearInterval(intervalHold)
      }
    })
  }, [])
  const [results, setResults] = useState([])
  const [newBatchTimestamp, setNewBatchTimestamp] = useState(0)
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0)
  const fetchy = async () => {
    let data
    if (window && window.fetch) {
      data = await window.fetch('https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/votes-remaining-page/national/president.json')
        .then(response => response.json())
        .then(data => data || [])
    }
    if (data) {
      const rows = []
      let hasUpdate = false
      STATE_INDEXES.forEach((index) => {
        const race = data?.data?.races[index]
        if (race) {
          const record = {
            candidates: race.candidates,
            leaderMarginVotes: race.leader_margin_votes,
            state: race.state_id
          }
          const raceLastUpdatedAt = new Date(race.last_updated).getTime()
          if (!timestamp || raceLastUpdatedAt > timestamp) {
            timestamp = raceLastUpdatedAt
          }
          if (reeeeee[index] !== race.candidates[0].votes) {
            hasUpdate = true
            reeeeee[index] = race.candidates[0].votes
          }
          rows.push(record)
        }
      })
      if (hasUpdate) {
        const backup = { lastFetchTimestamp: Date.now(), timestamp, rows }
        const stringified = JSON.stringify(backup)
        window.localStorage.setItem('whosleadingbackup', stringified)
        setResults(rows)
        setNewBatchTimestamp(timestamp)
      }
      fetchyTimestamp = Date.now()
      setLastFetchTimestamp(fetchyTimestamp)
    }
  }
  return (
    <div className={styles.container}>
      <Head>
        <script async src='https://www.googletagmanager.com/gtag/js?id=G-PG7C38WJ21' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:description' content={'Who\'s Leading 2020 Battleground States'} />
        <meta name='twitter:title' content={'Who\'s Leading 2020 Battleground States'} />
        <meta name='twitter:image' content='meh.jpg' />
      </Head>
      {!!lastFetchTimestamp && <div><span>Last Checked: </span><span>{new Date(lastFetchTimestamp).toLocaleString()}</span></div>}
      {!!newBatchTimestamp && <div><span>Last New Batch: </span><span>{Math.round((Date.now() - newBatchTimestamp) / 60000)} minutes ago</span></div>}
      <div className={styles.row}><span>state</span> <span>candidate</span> <span>leads by</span> </div>
      {results?.map((record) => {
        const leadingCandidate = record.candidates[0]
        const color = leadingCandidate.last_name === 'Biden' ? 'blue' : 'red'
        return <div className={`${styles.row} ${styles[color]}`} key={record.state}><span>{record.state}</span> <span>{leadingCandidate.last_name}</span> <span>{record.leaderMarginVotes}</span> </div>
      })}
      <div className={styles.teeny}>
        <a href='https://twitter.com/explodedsoda' target='_blank' rel='noopener noreferrer'>@</a>
        <div>data sourced from <a href='https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/votes-remaining-page/national/president.json' target='_blank' rel='noopener noreferrer'>unofficial API</a> powering the NYT's election site</div>
      </div>
    </div>
  )
}
