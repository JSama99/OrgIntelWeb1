(() => {
  'use strict';

  const KEY = 'orgintel-hq-progress-v1';
  const TOTAL_STEPS = 8;
  let step = 0;
  let selected = -1;
  let evidenceSeen = new Set();
  let answerLocked = false;
  let overlay = null;

  const scenario = {
    question: 'Should we launch publicly now, delay two weeks, or release to a small beta group first?',
    options: [
      {
        title: 'Launch publicly now',
        benefit: '