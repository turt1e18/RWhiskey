import apiClient from './apiClient';
import type {InformationReportField,InformationReportSource} from './whiskeyV3Api';

export type ContributionKind='CORRECTION'|'NEW_BOTTLE'|'DUPLICATE'|'OTHER';
export type ContributionStatus='SUBMITTED'|'IN_REVIEW'|'NEEDS_INFO'|'HELD'|'DECIDED'|'APPLYING'|'APPLIED'|'APPLY_FAILED'|'WITHDRAWN';
export type ItemDecision='PENDING'|'APPROVED'|'SEPARATE_RELEASE'|'REJECTED'|'HELD';
export type ItemApply='NONE'|'APPLIED'|'FAILED'|'CONFLICT'|'REVERTED';
export type ContributionEntry='STANDALONE'|'NAV'|'NOTES_AI';

export interface ContributionTargetCandidate {bottlingId:number;displayName:string;edition:string|null;batchCode:string|null;
  ageYears:number|null;ageStatementType:string;abv:string|null;volumeMl:number|null;verified:boolean}
export interface ContributionSubmitInput {kind:ContributionKind;target?:{type:'CATALOG';id:number}|null;newBottle?:{name:string}|null;
  items:{field:InformationReportField;content?:string|null}[];source?:InformationReportSource|null;sourceUrl?:string|null;
  note?:string|null;entryPoint:ContributionEntry}
export interface ContributionReceipt {id:string;status:ContributionStatus;createdAt:string;fields:InformationReportField[];skippedPending:InformationReportField[]}
export interface ContributionSummary {id:string;kind:ContributionKind;status:ContributionStatus;targetName:string|null;itemCount:number;
  decisions:ItemDecision[];createdAt:string;updatedAt:string}
export interface ContributionItemView {field:InformationReportField;proposed:string|null;decision:ItemDecision;apply:ItemApply;reasonPublic:string|null}
export interface ContributionView {id:string;kind:ContributionKind;status:ContributionStatus;targetName:string|null;items:ContributionItemView[];
  source:InformationReportSource|null;sourceUrl:string|null;note:string|null;infoRequest:string|null;infoReply:string|null;createdAt:string;updatedAt:string}

export type FieldValue=Record<string,string|null>;
export interface AdminItem {field:InformationReportField;proposed:string|null;baseValue:FieldValue|null;decision:ItemDecision;
  decidedValue:Record<string,string>|null;reasonPublic:string|null;reasonInternal:string|null;apply:ItemApply}
export interface AdminSummary {id:string;kind:ContributionKind;status:ContributionStatus;targetType:string;targetName:string|null;
  fields:InformationReportField[];sameTargetOpen:number;distinctReporters:number;createdAt:string}
export interface AdminTarget {bottlingId:number;productId:number;displayName:string;bottlingVersion:number;verificationStatus:string;
  hasCertificate:boolean;siblingCount:number;verifiedSiblingCount:number;current:Record<string,FieldValue>}
export interface AdminEvent {id:number;actorUid:number|null;action:string;fromStatus:string|null;toStatus:string|null;reason:string|null;createdAt:string}
export interface AdminView {id:string;ownerUid:number;kind:ContributionKind;status:ContributionStatus;version:number;targetType:string;
  targetRef:string|null;targetSnapshot:Record<string,unknown>;target:AdminTarget|null;items:AdminItem[];source:InformationReportSource|null;
  sourceUrl:string|null;note:string|null;infoRequest:string|null;infoReply:string|null;similar:AdminSummary[];events:AdminEvent[];createdAt:string}
export interface DecisionItem {field:InformationReportField;decision:ItemDecision;decidedValue?:Record<string,string>|null;reasonPublic?:string|null;reasonInternal:string}
export interface ApplyResult {status:ContributionStatus;applied:string[];conflicts:string[];downgraded:number[];targetBottlingId:number|null}
export interface StaleEvidence {id:number;url:string;publisher:string;sourceType:string;mismatched:string[]}
export interface ReverifyPreview {bottlingId:number;displayName:string;bottlingVersion:number;verificationStatus:string;hasCertificate:boolean;
  required:Record<string,string>;stale:StaleEvidence[];trustedSourceTypes:string[]}
export interface ReverifyResult {bottlingId:number;verificationStatus:string;evidenceId:number;invalidated:number[]}

const json=(method:'POST',body:unknown,headers?:Record<string,string>)=>({method,body:JSON.stringify(body),headers,timeoutMs:10_000});
const id=(v:string)=>encodeURIComponent(v);

export const contributionApi={
  targets:(q:string)=>apiClient<ContributionTargetCandidate[]>(`/api/whisky-contributions/targets?q=${encodeURIComponent(q)}`,{timeoutMs:8_000}),
  submit:(input:ContributionSubmitInput)=>apiClient<ContributionReceipt>('/api/whisky-contributions',json('POST',input)),
  mine:()=>apiClient<ContributionSummary[]>('/api/whisky-contributions/mine',{timeoutMs:8_000}),
  detail:(cid:string)=>apiClient<ContributionView>(`/api/whisky-contributions/${id(cid)}`,{timeoutMs:8_000}),
  reply:(cid:string,text:string)=>apiClient<ContributionView>(`/api/whisky-contributions/${id(cid)}/reply`,json('POST',{text})),
  withdraw:(cid:string)=>apiClient<ContributionView>(`/api/whisky-contributions/${id(cid)}/withdraw`,json('POST',{})),
};

export const contributionAdminApi={
  list:(status?:ContributionStatus)=>apiClient<AdminSummary[]>(`/api/admin/contributions${status?`?status=${status}`:''}`,{timeoutMs:8_000}),
  detail:(cid:string)=>apiClient<AdminView>(`/api/admin/contributions/${id(cid)}`,{timeoutMs:8_000}),
  decide:(cid:string,body:{version:number;items:DecisionItem[];status?:'HELD'|'NEEDS_INFO'|null;infoRequest?:string|null})=>
    apiClient<AdminView>(`/api/admin/contributions/${id(cid)}/decisions`,json('POST',body)),
  apply:(cid:string,key:string,body:{version:number;expectedBottlingVersion?:number|null;create?:boolean;acknowledgeDowngrade?:boolean;
    evidence?:{url:string;sourceType:string;publisher:string;observedFields:Record<string,string>}|null})=>
    apiClient<ApplyResult>(`/api/admin/contributions/${id(cid)}/apply`,json('POST',body,{'Idempotency-Key':key})),
  retarget:(cid:string,body:{version:number;bottlingId:number})=>apiClient<AdminView>(`/api/admin/contributions/${id(cid)}/retarget`,json('POST',body)),
  reverifyPreview:(bottlingId:number)=>apiClient<ReverifyPreview>(`/api/admin/catalog/bottlings/${bottlingId}/reverify-preview`,{timeoutMs:8_000}),
  reverify:(bottlingId:number,body:{expectedBottlingVersion:number;evidence:{url:string;sourceType:string;publisher:string;observedFields:Record<string,string>};
    invalidateEvidenceIds:number[];reason:string})=>apiClient<ReverifyResult>(`/api/admin/catalog/bottlings/${bottlingId}/reverify`,json('POST',body)),
};
