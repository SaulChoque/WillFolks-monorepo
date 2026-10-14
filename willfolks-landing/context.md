# WillFolks

# Project Objectives

## General Objective

Develop a mobile aplication to help people to achieve their goals through gamificated savings
The person is going to stake a certain ammount in order to achieve it’s goal, this goal could be something like get up early, stop using certain apps, arrive to a place on time, those goals could be played singularly or with other people like a competition.
If the person does everything right the money is not going to be locked and can be withdrawn any time, but if the goal is not achieved, the staked ammount is going to be locked by a certain ammount of time as a penalization (the money also could go as a donation for the developer or as a payment for a multiplayer bet)

There are other types of goals which cannot be measured, like “do homework, do house chores, etc” these ones will use an own internal AI agent who’s responsible for determine if the goal was achieved or not or use another phone’s AI agent using a p2p network where using something similar to the x402 protocol the phone will pay the other phone to use its AI to determine the state of the goal.

## Functional Requirements

**RF-01:** System must allow new users sign ups with minimal personal data collection.

**RF-02:** System must allow login for already registered users.

**RF-02:** System must allow account recovery.

**RF-03:** System must allow the creation of meassurable and non meassurable goals.

**RF-04:** System must have a personal profile system.

**RF-05:** System must allow befriending other users in the platform.

**RF-06:** System must allow other users to join and/or compete in external goals.

**RF-07:** System must allow deposits and withdrawals of FIAT and cryptocurrency.

**RF-08:** System must allow automatic payments to other users.

**RF-09:** System must allow alarms and timers creation.

**RF-10:** System must allow alarm music from third party music apps.

**RF-11:** System must keep track of device’s meassurable data.

**RF-12:** System must generate personal reports of all the user activity.

**RF-13:** System must notify about all new events in the app.

**RF-14:** System must show deposits and withdrawal history.

**RF-15:** System must show payment vouchers.

**RF-15:** System must have a gamification system like some kind of pou.

## Non-functional requirements

**RNF-01:** System must be responsive and react in atleast 2 seconds.

**RNF-02:** System must be active most of the time.

**RNF-03:** Access to the system must be via oauth.

**RNF-04:** An internal app wallet must be created with the oauth login.

**RNF-04:** All of the scrow and resolution logic must be onchain.

**RNF-05:** UI must be modern, intuitive and responsive (with transparencies like old game consoles).

**RNF-06:** System must be mobile first.

**RNF-06:** System should be crossplatform.

**RNF-08:** App should be compatible with many different phones .

**RNF-09:** System must be resilient against errors and exceptions, specially in the payment flow.

**RNF-10:** System must be upgradeable.

**RNF-12:** System must have mechanisms of wallet and account recovery.

**RNF-13:** System must recover itself after a shutdown in at least 1 hour.

**RNF-14:** App must delete active sessions after inactivity.

**RNF-16:** System must have accessibility settings.

**RNF-17:** Info must be consistent across the entire system.

**RNF-18:** System must support at least 500 users simultaneously.

**RNF-19:** System should have multichain support.

**RNF-19:** System should have multiple payment options.

**RNF-20:** Changes should be inmediate in the system.

**RNF-23:** Personal data must be private and confidential.

**RNF-24:** System should have validation mechanisms.

**RNF-27:** System must allow multiple users simultaneously without issues.

**RNF-28:** System must inform about critical errors.

**RNF-29:** Reports must be accessible at all times.

**RNF-30:** System must comply with data privacy best practices and regulations.