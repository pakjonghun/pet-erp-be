## 판매 매출 재고관리 ERP

### 개요
- 재고관리 : 제품 발주 부터 입,출고와 판매까지 편리하게 관리하기 위해 만든 프로젝트 입니다.
- 편의성을 위해 엑셀파일과 연동 및, 기존 재고 관리 시스템(사방넷)과 데이터 동기화 가 된 프로젝트 입니다.

### 사용기술
- front : nextjs, react, graphql, apollo-client, materialUI
- backend : nestjs, graphql, apollo-server, mongodb
- devops & deploy 
  - 실배포 : aws beanstalk, cloudfront, codepipeline
  - 테스트 배포 : vercel, heroku

### 주안점
- 최적화
  - erp 특성상 소수의 사람이 이용해도 트레픽이 많이 발생하는 점은 고려하여 최적화를 위해 graphql 을 사용하였습니다.
  - 대시보드 같은 무거운 페이지의 경우 nextjs 의 병렬 라우팅 기능을 이용 하였습니다.
- 일관성
  - 인터페이스 일관성을 유지하기 위해 code-generator 를 사용하여 백앤드에서 정의한 타입을 프론트에서 그대로 사용하였습니다.

### 향후 추진방향
- 예상보다 데이터를 참조하는 케이스가 많아서 현재 no-sql 을 sql 로 변경할 필요성을 검토 하여 진행할 예정입니다.
- 필요시 cron-tab 스케줄 기능은 별도 서버를 두어 서버를 분리하는 작업을 검토 진행할 예정입니다.(다른 업체 db 와 동기화시)
- 사용내역의 쿼리 기록을 살펴보고 Field 에 index 를 추가로 설정 하는등 추가 최적화 작업을 진행할 예정입니다.
