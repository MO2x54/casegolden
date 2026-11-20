# Security Specification — Bank El-Hazz Online (بنك الحظ أونلاين)

## 1. Data Invariants
1. **Authenticated Sessions Only**: Every read and write to `/rooms/{roomId}` and `/rooms/{roomId}/messages/{messageId}` requires a valid Firebase Auth session (`request.auth != null`, supporting both Anonymous Authentication and Google Login).
2. **Room Ownership & Immutability**: `roomId`, `hostUid`, and `createdAt` are immutable after creation. On creation, `hostUid` MUST equal `request.auth.uid`, `status` MUST be `'lobby'`, and `playerUids` MUST be `[request.auth.uid]`.
3. **Bounded Room Membership (Max 10)**: `playerUids` is strictly bounded to `1 <= size <= 10`. Players may only join when `status == 'lobby'` and `playerUids.size() < 10`, appending only their own `request.auth.uid`.
4. **Action-Based State Transitions**: Updates to `/rooms/{roomId}` are partitioned into explicit actions (join lobby, leave lobby, host lobby settings/start, member gameplay move). Each action enforces an exact `affectedKeys().hasOnly(...)` allowlist.
5. **Terminal State Locking**: Once `status == 'finished'`, no further updates to `/rooms/{roomId}` are permitted.
6. **Master Gate on Subcollections**: Creating or reading messages in `/rooms/{roomId}/messages/{messageId}` requires membership in the parent room (`/rooms/{roomId}`), with `senderUid == request.auth.uid`, immutable messages (no edits), and strict `text.size() <= 240`.
7. **Temporal Integrity**: `createdAt` and `updatedAt` MUST equal `request.time` (server timestamps).
8. **Zero PII Storage**: Rooms and chat messages store only player nicknames, avatar tokens/colors, and board game state—never emails, phone numbers, or addresses.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Room Read/Create**: Request with `auth == null` attempting to create or read `/rooms/AB123`.
2. **Host Impersonation on Create**: Authenticated user `uidA` creates `/rooms/AB123` with `hostUid: "uidB"`.
3. **Shadow / Ghost Field Injection**: User creates or updates `/rooms/AB123` with an undeclared field `isAdmin: true` or `extraCash: 999999`.
4. **ID Poisoning**: User attempts to create `/rooms/THIS_IS_A_MALICIOUS_1500_BYTE_ROOM_ID` (violates `^[A-Z0-9]{5}$`).
5. **Over-Capacity Join**: User attempts to join a room that already has 10 players in `playerUids`.
6. **Late Join During Active Game**: Non-member attempts to add their UID to `playerUids` while `status == 'playing'`.
7. **Non-Host Settings Tampering**: Non-host lobby member tries to change `settings` or flip `status` from `'lobby'` to `'playing'`.
8. **Immutable Field Mutation**: Room member attempts to overwrite `hostUid`, `roomId`, or `createdAt` during an update.
9. **Terminal State Resurrection**: Room member attempts to modify `gameState` or revert `status` after `existing().status == 'finished'`.
10. **Forged Timestamp**: Client submits a client-fabricated `updatedAt` timestamp instead of `serverTimestamp()` (`request.time`).
11. **Chat Sender Spoofing / Non-Member Chat**: Non-member of `/rooms/AB123` or member spoofing `senderUid: "otherUid"` attempts to write to `/rooms/AB123/messages/msg1`.
12. **Denial-of-Wallet Oversized Payload**: Member attempts to post a chat message with `text.size() > 240` or `senderName.size() > 32`, or list `/rooms` without being in `resource.data.playerUids`.
