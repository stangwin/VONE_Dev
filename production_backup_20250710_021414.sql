--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customer_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_files (
    id integer NOT NULL,
    customer_id text NOT NULL,
    file_name text NOT NULL,
    original_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_files OWNER TO neondb_owner;

--
-- Name: customer_files_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customer_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_files_id_seq OWNER TO neondb_owner;

--
-- Name: customer_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customer_files_id_seq OWNED BY public.customer_files.id;


--
-- Name: customer_notes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_notes (
    id integer NOT NULL,
    customer_id text NOT NULL,
    author_id integer,
    author_name text,
    content text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    type text DEFAULT 'manual'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer_notes OWNER TO neondb_owner;

--
-- Name: customer_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customer_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_notes_id_seq OWNER TO neondb_owner;

--
-- Name: customer_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customer_notes_id_seq OWNED BY public.customer_notes.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    customer_id text NOT NULL,
    company_name text NOT NULL,
    status text DEFAULT 'Lead'::text NOT NULL,
    affiliate_partner text,
    next_step text,
    physical_address text,
    billing_address text,
    primary_contact jsonb,
    authorized_signer jsonb,
    billing_contact jsonb,
    notes jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: session_dev; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session_dev (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session_dev OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text,
    auth_provider text DEFAULT 'local'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    role character varying(20) DEFAULT 'user'::character varying,
    two_factor_secret text,
    two_factor_enabled timestamp without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: customer_files id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_files ALTER COLUMN id SET DEFAULT nextval('public.customer_files_id_seq'::regclass);


--
-- Name: customer_notes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_notes ALTER COLUMN id SET DEFAULT nextval('public.customer_notes_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: customer_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_files (id, customer_id, file_name, original_name, file_url, file_type, file_size, upload_date, created_at) FROM stdin;
3	customer_007	1750940896829-31541104.jpeg	IMG_2305.jpeg	/uploads/customer_007/1750940896829-31541104.jpeg	image/jpeg	2699976	2025-06-26 12:28:16.860294	2025-06-26 12:28:16.860294
4	customer_007	1750945682566-513018478.jpeg	IMG_2485.jpeg	/uploads/customer_007/1750945682566-513018478.jpeg	image/jpeg	3804114	2025-06-26 13:48:02.597996	2025-06-26 13:48:02.597996
5	customer_007	1750945682636-514275282.jpeg	IMG_2486.jpeg	/uploads/customer_007/1750945682636-514275282.jpeg	image/jpeg	2768195	2025-06-26 13:48:02.669779	2025-06-26 13:48:02.669779
6	customer_007	1750945682699-141247766.jpeg	IMG_2487.jpeg	/uploads/customer_007/1750945682699-141247766.jpeg	image/jpeg	4009693	2025-06-26 13:48:02.730213	2025-06-26 13:48:02.730213
7	customer_007	1750945682757-266068565.jpeg	IMG_2489.jpeg	/uploads/customer_007/1750945682757-266068565.jpeg	image/jpeg	2278624	2025-06-26 13:48:02.788097	2025-06-26 13:48:02.788097
8	customer_007	1750945682815-821496808.jpeg	IMG_2490.jpeg	/uploads/customer_007/1750945682815-821496808.jpeg	image/jpeg	2987575	2025-06-26 13:48:02.846137	2025-06-26 13:48:02.846137
19	customer_001	1750966850644-826257314.jpeg	WhatsApp Image 2025-06-26 at 12.09.13.jpeg	/uploads/customer_001/1750966850644-826257314.jpeg	image/jpeg	366622	2025-06-26 19:40:50.675225	2025-06-26 19:40:50.675225
20	customer_001	1750966850712-618852874.jpeg	WhatsApp Image 2025-06-26 at 12.09.25.jpeg	/uploads/customer_001/1750966850712-618852874.jpeg	image/jpeg	255165	2025-06-26 19:40:50.743619	2025-06-26 19:40:50.743619
21	customer_001	1750966850770-723408098.jpeg	WhatsApp Image 2025-06-26 at 12.09.38.jpeg	/uploads/customer_001/1750966850770-723408098.jpeg	image/jpeg	442263	2025-06-26 19:40:50.802043	2025-06-26 19:40:50.802043
22	customer_001	1750966850829-477287932.jpeg	WhatsApp Image 2025-06-26 at 12.25.37.jpeg	/uploads/customer_001/1750966850829-477287932.jpeg	image/jpeg	420546	2025-06-26 19:40:50.86033	2025-06-26 19:40:50.86033
23	customer_001	1750966850887-108559233.jpeg	WhatsApp Image 2025-06-26 at 12.25.56.jpeg	/uploads/customer_001/1750966850887-108559233.jpeg	image/jpeg	395777	2025-06-26 19:40:50.918281	2025-06-26 19:40:50.918281
24	customer_001	1750966850945-116203485.jpeg	WhatsApp Image 2025-06-26 at 12.26.21.jpeg	/uploads/customer_001/1750966850945-116203485.jpeg	image/jpeg	448863	2025-06-26 19:40:50.977183	2025-06-26 19:40:50.977183
25	customer_001	1750966851004-714896404.jpeg	WhatsApp Image 2025-06-26 at 12.27.04.jpeg	/uploads/customer_001/1750966851004-714896404.jpeg	image/jpeg	448434	2025-06-26 19:40:51.035097	2025-06-26 19:40:51.035097
26	customer_001	1750966851062-850917512.jpeg	WhatsApp Image 2025-06-26 at 12.28.15.jpeg	/uploads/customer_001/1750966851062-850917512.jpeg	image/jpeg	322620	2025-06-26 19:40:51.093083	2025-06-26 19:40:51.093083
27	customer_001	1750966851119-24308850.jpeg	WhatsApp Image 2025-06-26 at 12.28.19.jpeg	/uploads/customer_001/1750966851119-24308850.jpeg	image/jpeg	350903	2025-06-26 19:40:51.151266	2025-06-26 19:40:51.151266
28	customer_001	1750966851178-554449477.jpeg	WhatsApp Image 2025-06-26 at 12.28.28.jpeg	/uploads/customer_001/1750966851178-554449477.jpeg	image/jpeg	368858	2025-06-26 19:40:51.210929	2025-06-26 19:40:51.210929
30	customer_007	1751043778665-970629041.jpeg	IMG_2505[1].jpeg	/uploads/customer_007/1751043778665-970629041.jpeg	image/jpeg	1968466	2025-06-27 17:02:58.696342	2025-06-27 17:02:58.696342
31	customer_007	1751043778724-465331262.jpeg	IMG_2506.jpeg	/uploads/customer_007/1751043778724-465331262.jpeg	image/jpeg	1522712	2025-06-27 17:02:58.755613	2025-06-27 17:02:58.755613
33	customer_007	1751043778842-315733259.jpeg	IMG_2507.jpeg	/uploads/customer_007/1751043778842-315733259.jpeg	image/jpeg	1905545	2025-06-27 17:02:58.87374	2025-06-27 17:02:58.87374
35	customer_007	1751053003777-57846402.jpeg	IMG_2505[1].jpeg	/uploads/customer_007/1751053003777-57846402.jpeg	image/jpeg	1968466	2025-06-27 19:36:43.808638	2025-06-27 19:36:43.808638
36	customer_001	1751734138817-539245551.jpeg	1750966850644-826257314.jpeg	/uploads/customer_001/1751734138817-539245551.jpeg	image/jpeg	366622	2025-07-05 16:48:58.849516	2025-07-05 16:48:58.849516
37	customer_011	1751734203137-34748836.HEIC	Charleston 1.HEIC	/uploads/customer_011/1751734203137-34748836.HEIC	image/heic	345555	2025-07-05 16:50:03.167659	2025-07-05 16:50:03.167659
38	customer_011	1751734203206-848582119.HEIC	Charleston 2.HEIC	/uploads/customer_011/1751734203206-848582119.HEIC	image/heic	233674	2025-07-05 16:50:03.236456	2025-07-05 16:50:03.236456
39	customer_011	1751734203262-758611808.HEIC	Daniel Island 1.HEIC	/uploads/customer_011/1751734203262-758611808.HEIC	image/heic	1562972	2025-07-05 16:50:03.293419	2025-07-05 16:50:03.293419
40	customer_011	1751734203319-132621197.HEIC	Daniel Island 2.HEIC	/uploads/customer_011/1751734203319-132621197.HEIC	image/heic	1840787	2025-07-05 16:50:03.351873	2025-07-05 16:50:03.351873
41	customer_011	1751734203378-703670185.HEIC	Ellorie 1.HEIC	/uploads/customer_011/1751734203378-703670185.HEIC	image/heic	1788190	2025-07-05 16:50:03.409037	2025-07-05 16:50:03.409037
42	customer_011	1751734203435-399885053.HEIC	Ellorie 2.HEIC	/uploads/customer_011/1751734203435-399885053.HEIC	image/heic	939051	2025-07-05 16:50:03.465616	2025-07-05 16:50:03.465616
43	customer_011	1751734203492-705052066.HEIC	Eutawville 1.HEIC	/uploads/customer_011/1751734203492-705052066.HEIC	image/heic	2108046	2025-07-05 16:50:03.522296	2025-07-05 16:50:03.522296
44	customer_011	1751734203548-91254088.HEIC	Hollywood 2.HEIC	/uploads/customer_011/1751734203548-91254088.HEIC	image/heic	2219229	2025-07-05 16:50:03.578858	2025-07-05 16:50:03.578858
45	customer_011	1751734203612-810056260.HEIC	Isle of Palms 1.HEIC	/uploads/customer_011/1751734203612-810056260.HEIC	image/heic	2568867	2025-07-05 16:50:03.642571	2025-07-05 16:50:03.642571
46	customer_011	1751734203669-162151807.HEIC	Isle of Palms 2.HEIC	/uploads/customer_011/1751734203669-162151807.HEIC	image/heic	2360944	2025-07-05 16:50:03.699615	2025-07-05 16:50:03.699615
47	customer_011	1751734203726-87594264.HEIC	Moncks Corner 1.HEIC	/uploads/customer_011/1751734203726-87594264.HEIC	image/heic	1840787	2025-07-05 16:50:03.758491	2025-07-05 16:50:03.758491
48	customer_011	1751734203785-487541468.HEIC	Moncks Corner 2.HEIC	/uploads/customer_011/1751734203785-487541468.HEIC	image/heic	1562972	2025-07-05 16:50:03.815515	2025-07-05 16:50:03.815515
49	customer_011	1751734203844-383738045.HEIC	North Litchfield 1.HEIC	/uploads/customer_011/1751734203844-383738045.HEIC	image/heic	2127267	2025-07-05 16:50:03.874346	2025-07-05 16:50:03.874346
50	customer_011	1751734203912-60700305.HEIC	North Litchfield 2.HEIC	/uploads/customer_011/1751734203912-60700305.HEIC	image/heic	1528734	2025-07-05 16:50:03.942451	2025-07-05 16:50:03.942451
51	customer_011	1751734203969-378105885.HEIC	Eutawville 2.HEIC	/uploads/customer_011/1751734203969-378105885.HEIC	image/heic	1795156	2025-07-05 16:50:03.999726	2025-07-05 16:50:03.999726
52	customer_011	1751734204026-875256844.HEIC	Hollywood 1.HEIC	/uploads/customer_011/1751734204026-875256844.HEIC	image/heic	1899620	2025-07-05 16:50:04.057816	2025-07-05 16:50:04.057816
53	customer_011	1751734251523-346596411.HEIC	Charleston 1.HEIC	/uploads/customer_011/1751734251523-346596411.HEIC	image/heic	345555	2025-07-05 16:50:51.553307	2025-07-05 16:50:51.553307
54	customer_011	1751734251580-235482086.HEIC	Charleston 2.HEIC	/uploads/customer_011/1751734251580-235482086.HEIC	image/heic	233674	2025-07-05 16:50:51.611241	2025-07-05 16:50:51.611241
55	customer_011	1751734251637-581711285.HEIC	Daniel Island 1.HEIC	/uploads/customer_011/1751734251637-581711285.HEIC	image/heic	1562972	2025-07-05 16:50:51.668166	2025-07-05 16:50:51.668166
56	customer_011	1751734251694-531960264.HEIC	Daniel Island 2.HEIC	/uploads/customer_011/1751734251694-531960264.HEIC	image/heic	1840787	2025-07-05 16:50:51.725012	2025-07-05 16:50:51.725012
57	customer_011	1751734251751-359230790.HEIC	Ellorie 1.HEIC	/uploads/customer_011/1751734251751-359230790.HEIC	image/heic	1788190	2025-07-05 16:50:51.78193	2025-07-05 16:50:51.78193
58	customer_011	1751734251808-512122073.HEIC	Ellorie 2.HEIC	/uploads/customer_011/1751734251808-512122073.HEIC	image/heic	939051	2025-07-05 16:50:51.838918	2025-07-05 16:50:51.838918
59	customer_011	1751734251865-374653998.HEIC	Eutawville 1.HEIC	/uploads/customer_011/1751734251865-374653998.HEIC	image/heic	2108046	2025-07-05 16:50:51.89629	2025-07-05 16:50:51.89629
60	customer_011	1751734251922-276627732.HEIC	Eutawville 2.HEIC	/uploads/customer_011/1751734251922-276627732.HEIC	image/heic	1795156	2025-07-05 16:50:51.953196	2025-07-05 16:50:51.953196
61	customer_011	1751734251979-294164577.HEIC	Hollywood 2.HEIC	/uploads/customer_011/1751734251979-294164577.HEIC	image/heic	2219229	2025-07-05 16:50:52.020531	2025-07-05 16:50:52.020531
62	customer_011	1751734252049-537971558.HEIC	Isle of Palms 1.HEIC	/uploads/customer_011/1751734252049-537971558.HEIC	image/heic	2568867	2025-07-05 16:50:52.079327	2025-07-05 16:50:52.079327
63	customer_011	1751734252105-194187874.HEIC	Isle of Palms 2.HEIC	/uploads/customer_011/1751734252105-194187874.HEIC	image/heic	2360944	2025-07-05 16:50:52.136193	2025-07-05 16:50:52.136193
64	customer_011	1751734252162-385743720.HEIC	Moncks Corner 1.HEIC	/uploads/customer_011/1751734252162-385743720.HEIC	image/heic	1840787	2025-07-05 16:50:52.19286	2025-07-05 16:50:52.19286
65	customer_011	1751734252219-15460886.HEIC	Moncks Corner 2.HEIC	/uploads/customer_011/1751734252219-15460886.HEIC	image/heic	1562972	2025-07-05 16:50:52.249664	2025-07-05 16:50:52.249664
66	customer_011	1751734252276-118262802.HEIC	North Litchfield 1.HEIC	/uploads/customer_011/1751734252276-118262802.HEIC	image/heic	2127267	2025-07-05 16:50:52.306466	2025-07-05 16:50:52.306466
67	customer_011	1751734252332-366035564.HEIC	North Litchfield 2.HEIC	/uploads/customer_011/1751734252332-366035564.HEIC	image/heic	1528734	2025-07-05 16:50:52.363285	2025-07-05 16:50:52.363285
68	customer_011	1751734252389-623156769.HEIC	Hollywood 1.HEIC	/uploads/customer_011/1751734252389-623156769.HEIC	image/heic	1899620	2025-07-05 16:50:52.420159	2025-07-05 16:50:52.420159
\.


--
-- Data for Name: customer_notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_notes (id, customer_id, author_id, author_name, content, "timestamp", type, created_at, updated_at) FROM stdin;
1	customer_001	6	Stan Gwin	I spoke with Asher a few minutes ago. He's going to get me a person to work with so that we can do the initial prep work and then the cut over. I also spoke with Voxo. Harley and Cameron are the ones working this phone cut. They seem to be ready to go. Need to wait for Asher to call me back. He's going to try to get some name Jose to work with me or he's going to work with me himself.	2025-06-26 20:27:33.435799	manual	2025-06-26 20:27:33.435799	2025-06-26 20:27:33.435799
2	customer_001	6	Stan Gwin	I spoke with Asher a few minutes ago. He's going to get me a person to work with so that we can do the initial prep work and then the cut over. I also spoke with Voxo. Harley and Cameron are the ones working this phone cut. They seem to be ready to go. Need to wait for Asher to call me back. He's going to try to get some name Jose to work with me or he's going to work with me himself.	2025-06-26 20:34:36.87052	manual	2025-06-26 20:34:36.87052	2025-06-26 20:34:36.87052
3	customer_003	6	Stan Gwin	Talked to Shelby this morning. She does not have Wi-Fi working. Figured out the Wi-Fi was being run on her old Draytek router from Lumistry. I've checked her Z3 and it has Wi-Fi capability. I've asked her if she'd like me to turn it on for her to test and see if she likes the service before she decides if she wants to keep it. We also discussed her phone bill. She has a phone bill from Bullock solutions that is the company that provides her Internet service for her. They are also charging her $38 a month for a phone line that she doesn't think she's using. She said she would check with Voxo and see if they had the number and if they don't have the number then she'll call and tell Bullock to disconnect it if they do have the number then she's going to call Bullock and tell them that they just stop the billing and give her a credit for all the money they've been spending they shouldn't have with them.	2025-06-27 16:53:53.60748	manual	2025-06-27 16:53:53.60748	2025-06-27 16:53:53.60748
4	customer_003	6	Stan Gwin	Talked to Shelby this morning. She does not have Wi-Fi working. Figured out the Wi-Fi was being run on her old Draytek router from Lumistry. I've checked her Z3 and it has Wi-Fi capability. I've asked her if she'd like me to turn it on for her to test and see if she likes the service before she decides if she wants to keep it. We also discussed her phone bill. She has a phone bill from Bullock solutions that is the company that provides her Internet service for her. They are also charging her $38 a month for a phone line that she doesn't think she's using. She said she would check with Voxo and see if they had the number and if they don't have the number then she'll call and tell Bullock to disconnect it if they do have the number then she's going to call Bullock and tell them that they just stop the billing and give her a credit for all the money they've been spending they shouldn't have with them.	2025-06-27 16:53:54.96743	manual	2025-06-27 16:53:54.96743	2025-06-27 16:53:54.96743
5	customer_007	6	Stan Gwin	Have been talking to Voxo this morning about Walter and this location. They're having problems getting phones to pick up on the network. Can't get the firewall to get an IP address and pick up on the network either. We have no access to anything that they're plugging in. There's something wrong with their existing firewall/router. It may be running off IP addresses or it may have some other issue. Voxo is looking into it now and they're waiting on credentials to come from Lumistry for the existing Dray Tech firewall..	2025-06-27 17:06:37.371948	manual	2025-06-27 17:06:37.371948	2025-06-27 17:06:37.371948
6	customer_001	6	Stan Gwin	From Harley Moorman at Voxo regarding new phone service there --I am installing My Pharmacist on Call right now. Going very well with Manual. He mentioned to me about the firewall and said he will look into setting it up after the phone install.	2025-06-27 17:07:33.935096	manual	2025-06-27 17:07:33.935096	2025-06-27 17:07:33.935096
7	customer_007	6	System	Files uploaded: File uploaded: "IMG_2505[1].jpeg"	2025-06-27 19:36:44.152526	system	2025-06-27 19:36:44.152526	2025-06-27 19:36:44.152526
8	customer_003	4	Test User	Turned on WiFi for Shelby. Need to follow in a week and see how it’s working for her.	2025-06-28 22:09:16.455289	manual	2025-06-28 22:09:16.455289	2025-06-28 22:09:16.455289
9	customer_011	4	System	16 photos were uploaded to this customer record but were accidentally deleted during file management system improvements on June 26, 2025. The files were properly uploaded after PostgreSQL database was established, but were removed during file deletion system debugging (commits 3fbab5b and 2162c96). Database records show missing IDs 1,2,9-18,29,32,34 which correspond to the 16 deleted files. Please re-upload the missing photos for this customer.	2025-07-01 22:58:19.463506	system	2025-07-01 22:58:19.463506	2025-07-01 23:01:21.938702
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, customer_id, company_name, status, affiliate_partner, next_step, physical_address, billing_address, primary_contact, authorized_signer, billing_contact, notes, created_at, updated_at, created_by, updated_by) FROM stdin;
1	customer_001	My Pharmacist On Call	Onboarding	VOXO	Schedule Install	3426 Whittier Blvd, Los Angeles, CA, 90023	3426 Whittier Blvd, Los Angeles, CA, 90023	{"name": "Jacqueline", "email": "ashers.assistant@gmail.com", "phone": "310-882-6661"}	{"name": "Asher Eghbali", "email": "asher.eghbali@gmail.com", "phone": ""}	{"name": "Asher Eghbali", "email": "ahsher.eghbali@gmail.com", "phone": "310-497-3109"}	[{"content": "Mr. Manuel is the Voice contact at 323-408-3860.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
2	customer_002	Berea Drug	Onboarding	VOXO	Perform Install	402 Richmond Road North, Berea, KY, 40403	402 Richmond Road North, Berea, KY, 40403	{"name": "Robert Little", "email": "bereadrug@yahoo.com", "phone": "859-986-4521"}	{"name": "Robert Little", "email": "bereadrug@yahoo.com", "phone": ""}	{"name": "Robert Little", "email": "bereadrug@yahoo.com", "phone": "859-986-4521"}	[{"content": "Installation Date: June 11, 2025", "timestamp": "2025-06-23T21:00:00.000Z"}, {"content": "Per call with Sally on 6/5/2025 -- Hardware is on site.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
3	customer_003	Southeast Pharmacy	Onboarding	VOXO	Schedule Install	400 Parker Avenue North, STE 500A, Brooklet, GA, 30415	400 Parker Avenue North, STE 500A, Brooklet, GA, 30415	{"name": "Shelby Hook", "email": "hookrx@gmail.com", "phone": "912-842-2040"}	{"name": "Shelby Hook", "email": "hookrx@gmail.com", "phone": ""}	{"name": "Shelby Hook", "email": "hookrx@gmail.com", "phone": "912-842-2040"}	[{"content": "Z3 is ordered from Network Tigers and shipped directly to the site.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
4	customer_004	Rancho Pueblo Pharmacy	Quoted	VOXO	Follow with VOXO AE			{"name": "Yash Patel", "email": "yashpatel031998@gmail.com", "phone": "951-972-8822"}	{"name": "Yash Patel", "email": "yashpatel031998@gmail.com", "phone": ""}	{"name": "", "email": "", "phone": ""}	[{"content": "Spoke with Yash. He had an issue with price. Rusty needs to go back and explain to him the whole story instead of just the voice portion", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
5	customer_005	CR Care Pharmacy	Lead	VOXO	Follow with VOXO AE	3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405	3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405	{"name": "Jackie Fitzgerald", "email": "crcarerx@gmail.com", "phone": "319-200-1188"}	{"name": "Jackie Fitzgerald", "email": "crcarerx@gmail.com", "phone": ""}	{"name": "", "email": "", "phone": ""}	[{"content": "Neal is reaching out to Jackie -- From Connect 2025. Saw her there. She is purposely waiting a few months to move forward with Voxo until she gets some folks back in the office.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
6	customer_006	McCoy Tygart Drug	Lead	VOXO				{"name": "Casey Hedden", "email": "casey@mccoytygartdrug.com", "phone": ""}	{"name": "", "email": "", "phone": ""}	{"name": "", "email": "", "phone": ""}	[{"content": "We have 4 stores in a 30 mile radius that we need to get VPN connected with each other. A not-so-distant goal is to get a centralized data entry location for these stores setup, with central fill a secondary goal.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
8	customer_008	Blanco Pharmacy and Wellness	Lead	VOXO				{"name": "Blakelee Speer", "email": "blakelee2006@msn.com", "phone": "830-833-4815"}	{"name": "", "email": "", "phone": ""}	{"name": "", "email": "", "phone": ""}	[{"content": "AT Connect 2025 -- moving to VOXO. One location. VPN has been too slow. Told her we'd troubleshoot before we start changing firewall.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
9	customer_009	Vital Care Infusion Services	Lead					{"name": "Jonathan Sims", "email": "", "phone": "601-596-2800"}	{"name": "Jonathan Sims", "email": "", "phone": ""}	{"name": "", "email": "", "phone": ""}	[{"content": "Per Levi at Voxo I called Blake Tubbs to discuss needs for both of these businesses. He has a vital care pharmacy and the compounder here in Hattiesburg. Vital care is a franchise and he also has another one in Baton Rouge.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
10	customer_010	The Compounder	Lead					{"name": "Jonathan Sims", "email": "", "phone": "601-596-2800"}	{"name": "Jonathan Sims", "email": "", "phone": ""}	{"name": "", "email": "", "phone": ""}	[]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
11	customer_011	Delta Pharmacy	Lead	VOXO				{"name": "Willis High", "email": "WHigh@delta-rx.com", "phone": "843-813-7874"}	{"name": "", "email": "", "phone": ""}	{"name": "", "email": "", "phone": ""}	[{"content": "This is eight locations. They can handle doing the installations themselves although they did ask about Turkey. Each location is going to be a firewall and they need Wi-Fi turned up.", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
12	customer_012	Mac Pharmacy	Lead	VOXO				{"name": "Sherif Mankaryous", "email": "", "phone": ""}	{"name": "", "email": "", "phone": ""}	{"name": "", "email": "", "phone": ""}	[]	2025-06-24 13:47:15.119522	2025-06-24 13:47:15.119522	\N	\N
14	customer_007	Sadler Hughes Apothecary	Onboarding	VOXO	\N	102 Jacobs Hwy, Clinton, SC, 29325	102 Jacobs Hwy, Clinton, SC, 29325	{"name": "Walter Hughes", "email": "", "phone": ""}	{"name": "Walter Hughes", "email": "whughes@sadlerhughes.com"}	{"name": "", "email": "", "phone": ""}	[{"content": "6/10/2025 -- Sent email to Walter requesting information for SA", "timestamp": "2025-06-23T21:00:00.000Z"}]	2025-06-24 13:47:15.119	2025-06-26 12:39:54.894425	\N	\N
\.


--
-- Data for Name: session_dev; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session_dev (sid, sess, expire) FROM stdin;
PUmIIzki7P9HWBKmQUVv375hm5rIgPap	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-04T17:35:06.414Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":4,"user":{"id":4,"name":"Test User","email":"test@test.com","auth_provider":"local","created_at":"2025-06-26T13:43:36.504Z","role":"admin","two_factor_secret":null,"two_factor_enabled":null}}	2025-08-04 17:35:07
cYC2kf6BnKX1b4PTygAPh2vdYEC2dfBM	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-04T17:36:42.594Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":6,"user":{"id":6,"name":"Stan Gwin","email":"Stan@vantix.tech","auth_provider":"local","created_at":"2025-06-26T15:36:04.499Z","role":"admin","two_factor_secret":null,"two_factor_enabled":null}}	2025-08-04 17:37:36
z1bL222OuorFqImRzkHm6yx53RE0bqEr	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-04T17:46:21.092Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":4,"user":{"id":4,"name":"Test User","email":"test@test.com","auth_provider":"local","created_at":"2025-06-26T13:43:36.504Z","role":"admin","two_factor_secret":null,"two_factor_enabled":null}}	2025-08-04 17:46:28
RpO3tRJ0keL5hXfvU6jPtMShHNG6p1N6	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-04T17:46:54.910Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":4,"user":{"id":4,"name":"Test User","email":"test@test.com","auth_provider":"local","created_at":"2025-06-26T13:43:36.504Z","role":"admin","two_factor_secret":null,"two_factor_enabled":null}}	2025-08-04 17:47:02
tqW0XpBWswgqaEosRrAdyvr3RDMh0GVK	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-06T17:28:16.200Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":4,"user":{"id":4,"name":"Test User","email":"test@test.com","auth_provider":"local","created_at":"2025-06-26T13:43:36.504Z","role":"admin","two_factor_secret":null,"two_factor_enabled":null}}	2025-08-06 17:28:27
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, name, email, password_hash, auth_provider, created_at, role, two_factor_secret, two_factor_enabled) FROM stdin;
4	Test User	test@test.com	$2b$12$MS2Guoiy6A9TUDJw90yzxOzuSdNbsBn05RAVdSIrClXd/aF7mIaOa	local	2025-06-26 13:43:36.504116	admin	\N	\N
5	Demo User	demo@demo.com	$2b$12$MS2Guoiy6A9TUDJw90yzxOzuSdNbsBn05RAVdSIrClXd/aF7mIaOa	local	2025-06-26 13:45:32.923307	user	\N	\N
6	Stan Gwin	Stan@vantix.tech	$2b$12$BwsFLxjez3a7ksQacUEuOOc0u3K8Xr5dtq5e.MWAIU3JMQd6.Hkou	local	2025-06-26 15:36:04.499609	admin	\N	\N
\.


--
-- Name: customer_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customer_files_id_seq', 68, true);


--
-- Name: customer_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customer_notes_id_seq', 9, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 15, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: customer_files customer_files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_files
    ADD CONSTRAINT customer_files_pkey PRIMARY KEY (id);


--
-- Name: customer_notes customer_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_notes
    ADD CONSTRAINT customer_notes_pkey PRIMARY KEY (id);


--
-- Name: customers customers_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_id_key UNIQUE (customer_id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: session_dev session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_dev
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session_dev USING btree (expire);


--
-- Name: customer_notes customer_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_notes
    ADD CONSTRAINT customer_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

