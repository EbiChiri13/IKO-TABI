"use client";

import { useState } from "react";
import TextField from "@/components/ui/TextField";
import DateRangeField from "@/components/ui/DateRangeField";
import Stepper from "@/components/ui/Stepper";
import Button from "@/components/ui/Button";
import type { CreateGroupInput } from "@/lib/api";

type CreateGroupFormProps = {
  readonly onSubmit: (values: CreateGroupInput) => void;
  readonly submitting: boolean;
  readonly error: string | null;
};

/** グループ作成フォーム本体（design: 部屋の名前 / 日程 / 人数）。仕様書B F-01 */
export default function CreateGroupForm({ onSubmit, submitting, error }: CreateGroupFormProps) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [memberLimit, setMemberLimit] = useState(2);

  const valid = name.trim().length > 0 && nickname.trim().length > 0 && start && end && end >= start;

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ name, nickname, start_date: start, end_date: end, member_limit: memberLimit });
      }}
    >
      <TextField
        label="部屋の名前"
        placeholder="例：卒業旅行メンバー"
        maxLength={20}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <DateRangeField start={start} end={end} onChangeStart={setStart} onChangeEnd={setEnd} />
      <Stepper label="人数" value={memberLimit} min={2} max={4} onChange={setMemberLimit} />
      <TextField
        label="あなたのニックネーム"
        placeholder="例：えび"
        maxLength={20}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <Button type="submit" variant="primary" block disabled={!valid || submitting}>
        {submitting ? "作成しています…" : "グループを作成"}
      </Button>
      <style jsx>{`
        .form { padding: 20px; display: flex; flex-direction: column; }
        .error { color: var(--danger); font-size: 0.85rem; margin: -8px 0 12px; }
      `}</style>
    </form>
  );
}
