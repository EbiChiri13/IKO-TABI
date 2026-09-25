"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import DateRangeField from "@/components/ui/DateRangeField";
import Stepper from "@/components/ui/Stepper";
import TextField from "@/components/ui/TextField";
import type { CreateGroupInput } from "@/lib/api";

type CreateGroupFormProps = {
  readonly onSubmit: (values: CreateGroupInput) => void;
  readonly submitting: boolean;
  readonly error: string | null;
};

/** グループ作成フォーム本体（Figma 473:5101 — 部屋の名前 y293 / 日程 y389 / 人数 y482 / ニックネーム / CTA y735）。仕様書B F-01 */
export default function CreateGroupForm({ onSubmit, submitting, error }: CreateGroupFormProps) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [memberLimit, setMemberLimit] = useState(2);

  const valid = name.trim().length > 0 && nickname.trim().length > 0 && start && end && end >= start;

  return (
    <form
      className="flex flex-1 flex-col px-[29px] pt-[80px] pb-[87px]"
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
      {error && <p className="mb-3! text-[0.85rem] font-medium text-destructive">{error}</p>}
      <div className="mt-auto">
        <Button type="submit" variant="primary" block disabled={!valid || submitting}>
          {submitting ? "作成しています…" : "グループを作成"}
        </Button>
      </div>
    </form>
  );
}
