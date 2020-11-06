import { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
const AZ_INDEX = 3
const GA_INDEX = 10
const NV_INDEX = 33
const PA_INDEX = 38
const STATE_INDEXES = [AZ_INDEX, GA_INDEX, NV_INDEX, PA_INDEX]
let timestamp
let reeeeee = {
  AZ_INDEX: 0,
  GA_INDEX: 0,
  NV_INDEX: 0,
  PA_INDEX: 0,
}
let intervalHold
export default function Home() {
  useEffect(() => {
    //cleanup
      window.localStorage.removeItem('wholeadingbackup')
    //cleanup
    let restored = window.localStorage.getItem('whoisleadingbackup') || '{}'
    restored = JSON.parse(restored)
    if (restored && restored?.timestamp) {
      setResults(restored.rows)
      timestamp = restored.timestamp
      setNewBatchTimestamp(restored.timestamp)
      setLastFetchTimestamp(restored.lastFetchTimestamp)
    } else {
      fetchy()
    }
    if (intervalHold) clearInterval(intervalHold)
    intervalHold = setInterval(() => fetchy(), 60000)
  }, [])
  const [results, setResults] = useState([])
  const [newBatchTimestamp, setNewBatchTimestamp] = useState('')
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState('')
  const fetchy = async () => {
    let data
    if (window && window.fetch) {
      data = await fetch('https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/votes-remaining-page/national/president.json')
      .then(response => response.json())
      .then(data => data || [])
    }
    if (data) {
      let rows = []
      let hasUpdate = false
      STATE_INDEXES.forEach((index) => {
        let race = data?.data?.races[index]
        if (!race) return
        let record = {
          candidates: race.candidates,
          estRemainingVotes: race['tot_exp_vote'] - race.votes,
          state: race['state_id']
        }
        if (reeeeee[index] !== race.candidates[0].votes) {
          hasUpdate = true
          reeeeee[index] = race.candidates[0].votes
          setNewBatchTimestamp(timestamp)
        }
        rows.push(record)
      })
      if (hasUpdate) {
        const backup = {lastFetchTimestamp: Date.now(), timestamp, rows}
        const stringified = JSON.stringify(backup)
        window.localStorage.setItem('whoisleadingbackup', stringified)
        setResults(rows)
      }
      setLastFetchTimestamp(Date.now())
    }
  }
  return (
    <div className={styles.container}>
      <Head>
        <script async src='https://www.googletagmanager.com/gtag/js?id=G-PG7C38WJ21'></script>
      </Head>
      {lastFetchTimestamp && <div><span>Last Checked: </span><span>{new Date(lastFetchTimestamp).toLocaleString()}</span></div>}
      {newBatchTimestamp && <div><span>Last New Batch: </span><span>{Math.round((Date.now() - newBatchTimestamp) / 60000)} minutes ago</span></div>}
      <div className={styles.row} ><span>state</span> <span>candidate</span> <span>leads by</span> <span>est votes remaining</span></div>
      {results?.map((record) => {
        let leadingCandidate = record.candidates[0]
        let trailingCandidate = record.candidates[1]
        let color = leadingCandidate['last_name'] === 'Biden' ? 'blue' : 'red'
        return <div className={`${styles.row} ${styles[color]}`} key={record.state}><span>{record.state}</span> <span>{leadingCandidate['last_name']}</span> <span>{leadingCandidate.votes - trailingCandidate.votes}</span> <span>{record.estRemainingVotes}</span></div>
      })}
      <a href='https://twitter.com/explodedsoda' target='_blank' rel='noopener noreferrer' className={styles.teeny}>@</a>
    </div>
  )
}
